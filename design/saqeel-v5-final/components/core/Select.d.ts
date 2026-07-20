/** Native select styled as an Astryx input. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: (string | { value: string; label: string })[];
}
export declare function Select(props: SelectProps): JSX.Element;
