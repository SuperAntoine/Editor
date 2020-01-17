import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { NetworkService } from './services/network.service';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { CanvaComponent } from './canva/canva.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
		CanvaComponent,
		ToolbarComponent
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
