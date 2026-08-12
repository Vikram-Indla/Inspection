"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Heading, Text } from "@/components/saqeel/type";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import type { SuggestionOption } from "@/features/planning-bulk/view";
import ChoiceGroup from "@/components/saqeel/choice-group/choice-group";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import DatePicker from "@/components/saqeel/date-picker/date-picker";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import {
  type GroupNode, type CriteriaNode, type CondNode, type Field as FieldKey, type FieldType, type Op,
  newCond, emptyTree, serializeCriteria, leaves, pathKey,
} from "./criteria";
import styles from "./criteria-builder.module.css";

export type BuilderField = {
  key: string;
  label: string;
  type: FieldType;
  operators: { op: Op; label: string }[];
  supplied: boolean;
  reason?: string;
};

export type CriteriaBuilderStrings = {
  heading: string;
  combineLabel: string; combineAll: string; combineAny: string;
  fieldLabel: string; opLabel: string; valueLabel: string; valuePlaceholder: string;
  valueToLabel: string; inHint: string; notSuppliedTag: string; notSuppliedSummary: string;
  addCondition: string; addGroup: string; remove: string; removeGroup: string;
  moveUp: string; moveDown: string;
  apply: string; clear: string;
  invalidTitle: string; invalidBody: string;
  contributionLabel: string; unfocusLabel: string;
  datePlaceholder: string; dateClear: string; dateToday: string;
  monthPrevious: string; monthNext: string;
};

function modifyGroupAt(root: GroupNode, path: number[], fn: (g: GroupNode) => GroupNode): GroupNode {
  if (path.length === 0) return fn(root);
  const [index, ...rest] = path;
  const child = root.children[index];
  if (!child || child.kind !== "group") return root;
  const children = root.children.slice();
  children[index] = modifyGroupAt(child, rest, fn);
  return { ...root, children };
}

function editChildren(root: GroupNode, parentPath: number[], fn: (ch: CriteriaNode[]) => CriteriaNode[]): GroupNode {
  return modifyGroupAt(root, parentPath, group => ({ ...group, children: fn(group.children) }));
}

const leafIncomplete = (c: CondNode): boolean => {
  const value = c.value.trim();
  if (value === "") return true;
  if (c.op !== "between") return false;
  const at = value.indexOf("..");
  if (at < 0) return true;
  return value.slice(0, at).trim() === "" || value.slice(at + 2).trim() === "";
};

export default function CriteriaBuilder({
  initialTree, fieldOptions, strings, contributions, focusedPath, onFocus,
  builderFields, cityByRegion, locale,
}: {
  initialTree: GroupNode;
  fieldOptions: Record<string, SuggestionOption[]>;
  strings: CriteriaBuilderStrings;
  contributions?: Record<string, number>;
  focusedPath?: string | null;
  onFocus?: (path: string | null) => void;
  builderFields: BuilderField[];
  cityByRegion?: Record<string, string[]>;
  locale: "ar" | "en";
}) {
  const [tree, setTree] = useState<GroupNode>(
    initialTree.children.length ? initialTree : { ...emptyTree(), children: [newCond()] }
  );
  const [showInvalid, setShowInvalid] = useState(false);
  const ct = useMemo(() => serializeCriteria(tree), [tree]);
  const invalid = useMemo(() => leaves(tree).filter(leaf => leafIncomplete(leaf.node)), [tree]);

  const fieldOf = (key: string): BuilderField => builderFields.find(f => f.key === key) ?? builderFields[0];
  const notSuppliedFields = builderFields.filter(f => !f.supplied);
  const fieldChoices: SelectOption[] = builderFields.map(f => ({
    value: f.key,
    label: f.label,
    disabled: !f.supplied,
    note: f.supplied ? undefined : strings.notSuppliedTag,
  }));

  const regionSelections = useMemo(() => {
    const chosen: string[] = [];
    for (const leaf of leaves(tree)) {
      if (leaf.node.field !== "region") continue;
      if (leaf.node.op === "eq") chosen.push(leaf.node.value.trim());
      if (leaf.node.op === "in") chosen.push(...leaf.node.value.split(",").map(part => part.trim()));
    }
    return chosen.filter(Boolean);
  }, [tree]);

  const optionsFor = (fieldKey: string): SuggestionOption[] => {
    if (fieldKey === "city" && cityByRegion && regionSelections.length > 0) {
      const union = new Set<string>();
      for (const region of regionSelections) for (const city of cityByRegion[region] ?? []) union.add(city);
      if (union.size > 0) return [...union].sort().map(city => ({ value: city, label: city }));
    }
    return fieldOptions[fieldKey] ?? [];
  };

  const addCond = (path: number[]) => setTree(t => editChildren(t, path, ch => [...ch, newCond()]));
  const addGroup = (path: number[]) =>
    setTree(t => editChildren(t, path, ch => [...ch, { kind: "group", combine: "any", children: [newCond()] }]));
  const setCombine = (path: number[], combine: "all" | "any") =>
    setTree(t => modifyGroupAt(t, path, group => ({ ...group, combine })));
  const removeAt = (parentPath: number[], index: number) =>
    setTree(t => editChildren(t, parentPath, ch => ch.filter((_, i) => i !== index)));
  const patchCond = (parentPath: number[], index: number, patch: Partial<CondNode>) =>
    setTree(t => editChildren(t, parentPath, ch =>
      ch.map((child, i) => (i === index && child.kind === "cond" ? { ...child, ...patch } : child))));
  const move = (parentPath: number[], index: number, direction: -1 | 1) =>
    setTree(t => editChildren(t, parentPath, ch => {
      const target = index + direction;
      if (target < 0 || target >= ch.length) return ch;
      const next = ch.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }));

  const valueInput = (c: CondNode, parentPath: number[], index: number, key: string): ReactNode => {
    const def = fieldOf(c.field);
    const patchValue = (value: string) => patchCond(parentPath, index, { value });
    const dateStrings = { clear: strings.dateClear, today: strings.dateToday };
    const monthLabels = { previous: strings.monthPrevious, next: strings.monthNext };

    if (c.op === "between") {
      const at = c.value.indexOf("..");
      const from = at < 0 ? c.value : c.value.slice(0, at);
      const to = at < 0 ? "" : c.value.slice(at + 2);
      const join = (a: string, b: string) => `${a}..${b}`;
      return (
        <>
          <div className={styles.fieldNarrow}>
            <Field label={strings.valueLabel} htmlFor={`crit-value-${key}`}>
              {def.type === "date"
                ? <DatePicker value={from} onChange={next => patchValue(join(next, to))} label={strings.valueLabel}
                    placeholder={strings.datePlaceholder} locale={locale} monthLabels={monthLabels} strings={dateStrings} />
                : <TextInput id={`crit-value-${key}`} type="number" value={from} label={strings.valueLabel}
                    onChange={next => patchValue(join(next, to))} />}
            </Field>
          </div>
          <div className={styles.fieldNarrow}>
            <Field label={strings.valueToLabel} htmlFor={`crit-value2-${key}`}>
              {def.type === "date"
                ? <DatePicker value={to} onChange={next => patchValue(join(from, next))} label={strings.valueToLabel}
                    placeholder={strings.datePlaceholder} locale={locale} monthLabels={monthLabels} strings={dateStrings} />
                : <TextInput id={`crit-value2-${key}`} type="number" value={to} label={strings.valueToLabel}
                    onChange={next => patchValue(join(from, next))} />}
            </Field>
          </div>
        </>
      );
    }

    if (def.type === "date") {
      return (
        <div className={styles.fieldNarrow}>
          <Field label={strings.valueLabel}>
            <DatePicker value={c.value} onChange={patchValue} label={strings.valueLabel}
              placeholder={strings.datePlaceholder} locale={locale} monthLabels={monthLabels} strings={dateStrings} />
          </Field>
        </div>
      );
    }

    if (def.type === "number") {
      return (
        <div className={styles.fieldNarrow}>
          <Field label={strings.valueLabel} htmlFor={`crit-value-${key}`}>
            <TextInput id={`crit-value-${key}`} type="number" value={c.value} label={strings.valueLabel}
              placeholder={strings.valuePlaceholder} onChange={patchValue} />
          </Field>
        </div>
      );
    }

    if (def.type === "enum" && c.op !== "in") {
      return (
        <div className={styles.field}>
          <Field label={strings.valueLabel}>
            <SaqeelSelect
              options={[{ value: "", label: strings.valuePlaceholder }, ...optionsFor(c.field)]}
              value={c.value}
              onChange={patchValue}
              label={strings.valueLabel}
            />
          </Field>
        </div>
      );
    }

    return (
      <div className={styles.field}>
        <Field label={strings.valueLabel} htmlFor={`crit-value-${key}`} hint={c.op === "in" ? strings.inHint : undefined}>
          <TextInput id={`crit-value-${key}`} value={c.value} label={strings.valueLabel}
            placeholder={strings.valuePlaceholder} onChange={patchValue} />
        </Field>
      </div>
    );
  };

  const renderCond = (c: CondNode, parentPath: number[], index: number, count: number): ReactNode => {
    const key = pathKey([...parentPath, index]);
    const contribution = contributions?.[key];
    const isFocused = focusedPath === key;
    const def = fieldOf(c.field);
    return (
      <li key={key} className={styles.condition}>
        <div className={styles.field}>
          <Field label={strings.fieldLabel}>
            <SaqeelSelect
              options={fieldChoices}
              value={c.field}
              onChange={next => patchCond(parentPath, index, {
                field: next as FieldKey,
                op: fieldOf(next).operators[0]?.op ?? "eq",
                value: "",
              })}
              label={strings.fieldLabel}
            />
          </Field>
        </div>
        <div className={styles.fieldNarrow}>
          <Field label={strings.opLabel}>
            <SaqeelSelect
              options={def.operators.map(o => ({ value: o.op, label: o.label }))}
              value={c.op}
              onChange={next => patchCond(parentPath, index, { op: next as Op, value: "" })}
              label={strings.opLabel}
            />
          </Field>
        </div>
        {valueInput(c, parentPath, index, key)}
        {contribution != null ? (
          <Button
            variant={isFocused ? "secondary" : "tertiary"}
            size="sm"
            expanded={isFocused}
            onClick={() => onFocus?.(isFocused ? null : key)}
            label={isFocused ? strings.unfocusLabel : strings.contributionLabel.replace("{n}", String(contribution))}
          >
            {contribution}
          </Button>
        ) : null}
        <Button variant="tertiary" size="sm" icon="previousPage" compactLabel
          disabled={index === 0} onClick={() => move(parentPath, index, -1)} label={strings.moveUp}>
          {strings.moveUp}
        </Button>
        <Button variant="tertiary" size="sm" icon="nextPage" compactLabel
          disabled={index === count - 1} onClick={() => move(parentPath, index, 1)} label={strings.moveDown}>
          {strings.moveDown}
        </Button>
        <Button variant="tertiary" size="sm" icon="dismiss" compactLabel
          onClick={() => removeAt(parentPath, index)} label={strings.remove}>
          {strings.remove}
        </Button>
      </li>
    );
  };

  const renderGroup = (group: GroupNode, path: number[]): ReactNode => (
    <li key={pathKey(path)} className={styles.group}>
      <div className={styles.groupHead}>
        <ChoiceGroup
          legend={strings.combineLabel}
          name={`criteria-combine-${pathKey(path)}`}
          layout="inline"
          value={group.combine}
          options={[
            { value: "all", label: strings.combineAll },
            { value: "any", label: strings.combineAny },
          ]}
          onChange={next => setCombine(path, next === "any" ? "any" : "all")}
        />
        {path.length > 0 ? (
          <Button variant="tertiary" size="sm"
            onClick={() => removeAt(path.slice(0, -1), path[path.length - 1])} label={strings.removeGroup}>
            {strings.removeGroup}
          </Button>
        ) : null}
      </div>

      <ul className={styles.branch}>
        {group.children.map((child, i) => (child.kind === "cond"
          ? renderCond(child, path, i, group.children.length)
          : renderGroup(child, [...path, i])))}
      </ul>

      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onClick={() => addCond(path)} label={strings.addCondition}>
          {strings.addCondition}
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => addGroup(path)} label={strings.addGroup}>
          {strings.addGroup}
        </Button>
      </div>
    </li>
  );

  return (
    <form
      method="get"
      action="/planning/bulk"
      className={styles.root}
      aria-labelledby="criteria-heading"
      onSubmit={event => { if (invalid.length > 0) { event.preventDefault(); setShowInvalid(true); } }}
    >
      <Heading level={3} id="criteria-heading">{strings.heading}</Heading>
      <input type="hidden" name="ct" value={ct} />

      <ul className={styles.tree}>
        {renderGroup(tree, [])}
      </ul>

      {notSuppliedFields.length > 0 ? (
        <details className={styles.unavailable}>
          <summary className={styles.unavailableSummary}>
            <Text as="span" tone="muted">
              {strings.notSuppliedSummary.replace("{n}", String(notSuppliedFields.length))}
            </Text>
            <span className={styles.marker} aria-hidden="true" />
          </summary>
          <ul className={styles.notices}>
            {notSuppliedFields.map(f => (
              <li key={f.key} className={styles.notice}>
                <StatusPill tone="warning">{`${f.label} · ${strings.notSuppliedTag}`}</StatusPill>
                <Text as="span" tone="muted">{f.reason}</Text>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {showInvalid && invalid.length > 0 ? (
        <PlanningNotice tone="warning" label={strings.invalidTitle}>
          {strings.invalidBody.replace("{n}", String(invalid.length))}
        </PlanningNotice>
      ) : null}

      <div className={styles.footer}>
        <Button type="submit" variant="primary" label={strings.apply}>{strings.apply}</Button>
        <Button variant="tertiary" href="/planning/bulk" label={strings.clear}>{strings.clear}</Button>
      </div>
    </form>
  );
}
