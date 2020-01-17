import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NetworkService } from './services/network.service';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { CanvaComponent } from './canva/canva.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ParametersComponent } from './parameters/parameters.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
		CanvaComponent,
		ToolbarComponent,
		ParametersComponent
  ],
  imports: [
    BrowserModule,
		FormsModule
  ],
  providers: [
		NetworkService
	],
  bootstrap: [AppComponent]
})
export class AppModule { }
