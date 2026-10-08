import { Pipe, PipeTransform } from '@angular/core';
import { Marked } from 'marked';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  private readonly parser = new Marked({
    breaks: true,
    gfm: true,
    renderer: {
      // El HTML recibido se muestra como texto; Angular también filtra el resultado al insertarlo con innerHTML.
      html: ({ text }) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    },
  });

  transform(value: string): string { return this.parser.parse(value || '', { async: false }); }
}
