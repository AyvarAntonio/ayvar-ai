import { Routes } from '@angular/router';
import { ChatComponent } from './features/chat/chat/chat';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: '**', redirectTo: '' }
];