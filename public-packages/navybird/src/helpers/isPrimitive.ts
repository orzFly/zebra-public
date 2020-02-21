export function isPrimitive(val: any): val is null | undefined | boolean | string | number {
  return (
    val == null ||
    val === true ||
    val === false ||
    typeof val === "string" ||
    typeof val === "number"
  )
}