import {NgModule} from '@angular/core';
import {
  ShortenFromMiddlePipe,
  CapitalizePipe,
  CapitalizeWordsPipe,
  BytesPipe,
  FindByKeyPipe
} from "@common/pipes/app.pipes";

@NgModule({
  declarations: [
    ShortenFromMiddlePipe,
    CapitalizePipe,
    CapitalizeWordsPipe,
    BytesPipe,
    FindByKeyPipe
  ],
  exports: [
    ShortenFromMiddlePipe,
    CapitalizePipe,
    CapitalizeWordsPipe,
    BytesPipe,
    FindByKeyPipe
  ]
})

export class PipeModule {
}
