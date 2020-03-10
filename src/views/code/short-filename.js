//@flow
const windows_strategy = '\\'

export function short (full_filename : string, stop_at: number = 3) : string {
  let strategy = '/'
  let last = full_filename.length
  for (let index = 0; index < stop_at; index++) {
    last = full_filename.lastIndexOf(strategy, last - 1)
    // for Windows:
    if (last < 0) {
      strategy = windows_strategy
      last = full_filename.lastIndexOf(strategy)
    }

  }
  return full_filename.substring(last + 1)
}