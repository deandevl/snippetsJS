/**
 * Created by Rick on 2021-11-24.
 */
'use strict';
export const sqrt = Math.sqrt;
export function square(x) {
  return x * x;
}
export function diag(x,y) {
  return sqrt(square(x) + square(y));
}