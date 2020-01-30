import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NetworkService } from './services/network.service';

import { AppComponent } from './app.component';
import { CanvaComponent } from './canva/canva.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ParametersComponent } from './parameters/parameters.component';
import { OptionsComponent } from './options/options.component';

@NgModule({
    declarations: [
        AppComponent,
        CanvaComponent,
        ToolbarComponent,
        ParametersComponent,
        OptionsComponent
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
