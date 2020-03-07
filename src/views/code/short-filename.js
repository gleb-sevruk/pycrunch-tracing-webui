//@flow
export function short (full_filename : string, stop_at: number = 3) : string {
  let last = full_filename.length
  for (let index = 0; index < stop_at; index++) {
    last = full_filename.lastIndexOf('/', last - 1)

  }
  return full_filename.substring(last + 1)
}