/**
 * A message a lib function hands back instead of an English sentence: the key,
 * and the values it needs. Pure data, so lib stays free of React and a test can
 * translate it in either language. Rendered with `t(m.key, m.vars)`.
 */
import type { StringKey, Vars } from "./index.ts";

export interface Msg {
  key: StringKey;
  vars?: Vars;
}
