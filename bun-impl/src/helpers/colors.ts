import chalk from "chalk";

export const colors = {
  class: chalk.red,
  key: chalk.yellow,
  value: chalk.green,
};

export function colored(
  c: Object,
  config?: {
    exlucdeProps?: string[];
    customProps?: { key: string; value: string }[];
  }
) {
  let base = `${colors.class(c.constructor.name)}(`;

  if (config?.customProps) {
    for (const prop of config.customProps) {
      base += `${colors.key(prop.key)}: ${colors.value(prop.value)}, `;
    }
  }

  for (const prop of Object.getOwnPropertyNames(c).filter(
    (p) => !config?.exlucdeProps?.includes(p)
  )) {
    let val = (c as any)[prop];
    if (val === undefined) {
      continue;
    }

    base += `${colors.key(prop)}: ${colors.value((c as any)[prop])}, `;
  }

  return base.slice(0, -2) + ")";
}
