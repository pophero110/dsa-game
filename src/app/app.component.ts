import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BinaryTreeComponent } from './binary-tree/binary-tree.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BinaryTreeComponent, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'dsa-game';
}
