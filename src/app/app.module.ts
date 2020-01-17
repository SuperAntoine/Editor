import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { NetworkService } from './services/network.service';
import { SafeHtml } from './safe_html';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { CanvaComponent } from './canva/canva.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
		SafeHtml,
		CanvaComponent
  ],
  imports: [
    BrowserModule,
		DragDropModule
  ],
  providers: [
		NetworkService
	],
  bootstrap: [AppComponent]
})
export class AppModule { }
