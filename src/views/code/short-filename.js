//@flow
export function short (full_filename : string) : string {
  let last = full_filename.lastIndexOf('/') + 1
  return full_filename.substring(last)
}