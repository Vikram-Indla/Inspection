import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "i18n_sync.py"
SPEC = importlib.util.spec_from_file_location("i18n_sync", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class I18nSyncScannerTest(unittest.TestCase):
    def test_localization_callees_are_lexical_and_suffix_safe(self) -> None:
        source = '''
            t("plain.key", "Plain English")
            t("copy.key", copy("Governed English", "عربية معتمدة"))
            tr("tr.key", "Three argument English", "ترجمة ثلاثية")
            query.select("select.falsePositive", "must not scan")
            state.set("set.falsePositive", "must not scan")
            value.format("format.falsePositive", "must not scan")
            list.collect("collect.falsePositive", "must not scan")
            client.insert("insert.falsePositive", "must not scan")
        '''
        pairs = MODULE.extract_source_pairs(source)
        self.assertEqual(set(pairs), {"plain.key", "copy.key", "tr.key"})
        self.assertEqual(pairs["copy.key"]["ar"], "عربية معتمدة")

    def test_manifest_entries_require_explicit_manifest_mode(self) -> None:
        source = '{ key: "manifest.key", en: "Manifest English", context: "test" }'
        self.assertEqual(MODULE.extract_source_pairs(source), {})
        self.assertEqual(set(MODULE.extract_source_pairs(source, True)), {"manifest.key"})


if __name__ == "__main__":
    unittest.main()
