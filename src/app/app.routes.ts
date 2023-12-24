import { Routes } from '@angular/router';
import { BinaryTreeComponent } from './binary-tree/binary-tree.component';
import { TowerDefenseComponent } from './tower-defense/tower-defense.component';

export const routes: Routes = [
  { path: '', component: TowerDefenseComponent },
  { path: 'binary-tree', component: BinaryTreeComponent },
];
