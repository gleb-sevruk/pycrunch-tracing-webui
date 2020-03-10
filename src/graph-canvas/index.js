const Color = require('color')

function hashFrom (input: string) {
  let hash = 0, i, chr;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export class FileMethodsColor {
  base_color: Color
  last_known_color: Color
  method_colors: Array<string, number> = []

  constructor (base_color: number) {
    this.base_color = base_color
    this.last_known_color = base_color
  }
  get_next_color() : number {
    let result_value = this.last_known_color
    this.move_color_palette()
    return  result_value
  }

  move_color_palette () {
    let rgbNumber = Color(this.last_known_color).darken(0.025).rgbNumber()
    this.last_known_color = rgbNumber
  }

  color_for_method(method_name: string) : number {
    let color
    if (!this.method_colors.hasOwnProperty(method_name)) {
      color = this.get_next_color()
      this.method_colors[method_name] = color
    } else {
      color = this.method_colors[method_name]
    }
    return color
  }
}

export class FileColors {
  files: Array<string, FileMethodsColor> = []
  for_file_method(filename: string, method_name: string, duration: number) : number{
    let methodsColor
    if (!this.files.hasOwnProperty(filename)) {
      let random_color = hashFrom(filename)
      // random_color = Math.abs(random_color)
      methodsColor = new FileMethodsColor(random_color)
      this.files[filename] = methodsColor
    } else {
      methodsColor = this.files[filename]
    }
    // if (duration < 50) {
    //   return methodsColor.base_color
    // }
    return methodsColor.color_for_method(method_name)

  }
}