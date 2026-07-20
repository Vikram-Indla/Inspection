// SAQEEL Inspection Design System v1.0 — component barrel.
// New components; supersede the .ax-* families as consumers migrate.
export { Button, type ButtonProps } from "./actions/Button";
export { ButtonGroup, SplitButton, type ButtonGroupProps, type SplitButtonProps } from "./actions/ButtonGroup";
export { Field, type FieldProps } from "./inputs/Field";
export { Input, TextArea, type InputProps, type TextAreaProps } from "./inputs/Input";
export { Select, type SelectProps } from "./inputs/Select";
export { Checkbox, Switch, RadioGroup, type CheckboxProps, type SwitchProps, type RadioGroupProps } from "./inputs/Choice";
export { SegmentedControl, type SegmentedControlProps } from "./inputs/SegmentedControl";
export { FileUpload, type FileUploadProps } from "./inputs/FileUpload";
export { StatusBadge, STATUS_LABELS, type StatusBadgeProps, type StatusRole } from "./data/StatusBadge";
export { Tag, type TagProps } from "./data/Tag";
export { Avatar, UserChip, type AvatarProps, type UserChipProps } from "./data/Avatar";
export { Skeleton, Progress, type SkeletonProps, type ProgressProps } from "./feedback/Skeleton";
export { SeverityIndicator, type SeverityIndicatorProps } from "./inspection/SeverityIndicator";
export { ExceptionMark, RailCell, EXC_LABELS, type ExceptionMarkProps, type RailCellProps, type ExceptionTone } from "./signature/ExceptionRail";
