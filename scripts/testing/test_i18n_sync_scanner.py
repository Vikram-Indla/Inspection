import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "i18n_sync.py"
SPEC = importlib.util.spec_from_file_location("i18n_sync", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class I18nSyncScannerTest(unittest.TestCase):
    def test_only_accepted_governed_calls_cross_the_provenance_boundary(self) -> None:
        source = '''
            t("governed.key", "Governed English")
            t("governed.copy", copy("Governed copy", "نسخة معتمدة"))
            tr("governed.tr", "Governed tr", "ترجمة معتمدة")
            t("planned.but.unregistered", "Not accepted yet")
            t("NoDotEnglish", "نص محلي")
            t("A new version is ready", "يتوفر إصدار جديد")
            query.select("governed.key", "must not suffix-match")
            state.set("governed.copy", "must not suffix-match")
            value.format("governed.tr", "must not suffix-match")
        '''
        governed = {"governed.key", "governed.copy", "governed.tr"}
        pairs = MODULE.extract_source_pairs(source, governed)
        self.assertEqual(pairs, {
            "governed.key": "Governed English",
            "governed.copy": "Governed copy",
            "governed.tr": "Governed tr",
        })

    def test_real_tree_scan_preserves_the_complete_catalogue_without_prose(self) -> None:
        governed = {"governed.key": "Catalogue English", "catalogue.only": "Catalogue only"}
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, "fixture.tsx").write_text('''
                t("governed.key", "Source English")
                const t = (en: string, ar: string) => en;
                t("Local prose with spaces", "نص محلي")
            ''')
            pairs = MODULE.scan_source_tree(Path(directory), governed)
        self.assertEqual(pairs, {"governed.key": "Catalogue English", "catalogue.only": "Catalogue only"})


if __name__ == "__main__":
    unittest.main()
