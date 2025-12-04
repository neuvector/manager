import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  standalone: false,
  name: 'shortenFromMiddle'
})
export class ShortenFromMiddlePipe implements PipeTransform {
  transform(str: string | undefined, len: number = 8): string {
    if (str && str.length > len) {
      return `${str.substring(0, len - 8)}...${str.substring(
        str.length - 8,
        str.length
      )}`;
    }
    return str || '';
  }
}

@Pipe({ 
  standalone: false,
  name: 'capitalizeWord'
})
export class CapitalizePipe implements PipeTransform {
  transform(word: string | undefined): string {
    return !!word
      ? `${word.charAt(0).toUpperCase()}${word.substring(1).toLowerCase()}`
      : '';
  }
}

@Pipe({ 
  standalone: false,
  name: 'capitalizeWords'
})
export class CapitalizeWordsPipe implements PipeTransform {
  transform(words: string | undefined): string {
    let capitalizePipe = new CapitalizePipe();
    return !!words
      ? words
          .split(' ')
          .map(w => capitalizePipe.transform(w))
          .join(' ')
      : '';
  }
}

@Pipe({ 
  standalone: false,
  name: 'bytes'
})
export class BytesPipe implements PipeTransform {
  transform(
    bytes: string,
    precision: number | undefined = undefined,
    base: number = 1024
  ): string {
    if (bytes === '0') {
      return '';
    }
    if (isNaN(parseFloat(bytes)) || !isFinite(parseFloat(bytes))) return '-';
    if (typeof precision === 'undefined') precision = 1;

    let units = ['', 'kB', 'MB', 'GB', 'TB', 'PB'],
      number = Math.floor(Math.log(parseFloat(bytes)) / Math.log(base)),
      val = (parseFloat(bytes) / Math.pow(base, Math.floor(number))).toFixed(
        precision
      );

    return (
      (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) +
      ' ' +
      units[number]
    );
  }
}

/**
 * Finds an object from given source using the given key - value pairs
 */
@Pipe({
  standalone: false,
  name: 'findByKey',
  pure: false,
})
export class FindByKeyPipe implements PipeTransform {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Transform
   *
   * @param value A string or an array of strings to find from source
   * @param key Key of the object property to look for
   * @param source Array of objects to find from
   */
  transform(value: string | string[], key: string, source: any[]): any {
    if (Array.isArray(value)) {
      return value.map(item =>
        source.find(sourceItem => sourceItem[key] === item)
      );
    }

    return source.find(sourceItem => sourceItem[key] === value);
  }
}
