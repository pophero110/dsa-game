import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import GameBoard, { CellType } from './game-board';

@Component({
  imports: [],
  standalone: true,
  templateUrl: './tower-defense.component.html',
  styleUrls: ['./tower-defense.component.css'],
})
export class TowerDefenseComponent {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;
  context!: CanvasRenderingContext2D | null;
  gameBoard!: GameBoard;

  CellType = CellType;
  selectedTower: CellType | null = null;

  /**
   * Initial Game State
   */
  ngOnInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.gameBoard = new GameBoard(this.context);
    this.gameBoard.render();
    this.gameBoard.spawnMonsterWave();
    const gameLoop = () => {
      this.gameBoard.render();
      this.gameBoard.monsterWave.forEach((monster) => {
        if (monster.position.x > 465) {
          return;
        }
        monster.position.x += 0.5;
        this.gameBoard.drawMonster(monster);
      });
      window.requestAnimationFrame(gameLoop);
    };
    window.requestAnimationFrame(gameLoop);
  }

  /**
   * Process Input
   * Listen to host element envent
   * TODO: reduce event trigger times
   */
  @HostListener('mousemove', ['$event'])
  onHoverTowerPlacement(event: MouseEvent): void {
    // Only select canvas element with a selected tower
    if (
      event.target !== this.canvas.nativeElement ||
      this.selectedTower == null
    ) {
      return;
    }
    this.clearHoverTowerPlacement();
    const { row, col } = this.getCellPosition(event);
    if (this.gameBoard.cells[row][col].type == CellType.Empty) {
      this.gameBoard.cells[row][col].type = CellType.ArcherTower;
    }
    this.gameBoard.render();
  }

  @HostListener('mouseleave', ['$event'])
  onLeaveTowerPlacement(event: MouseEvent): void {
    this.clearHoverTowerPlacement();
  }

  clearHoverTowerPlacement(): void {
    if (this.gameBoard.hoveredTowerPlacement) {
      const { row, col } = this.gameBoard.hoveredTowerPlacement;
      this.gameBoard.cells[row][col].type = CellType.Empty;
      this.gameBoard.hoveredTowerPlacement = null;
    }
  }

  onSelectTower(towerType: CellType): void {
    if (this.selectedTower) {
      this.selectedTower = null;
    } else {
      this.selectedTower = towerType;
    }
  }

  @HostListener('click', ['$event'])
  onClickTowerPlacement(event: MouseEvent): void {
    // Only select canvas element
    if (event.target !== this.canvas.nativeElement) {
      return;
    }
    const { row, col } = this.getCellPosition(event);
    if (
      this.gameBoard.cells[row][col].type == CellType.Empty &&
      this.selectedTower
    ) {
      this.gameBoard.placeTower(row, col, this.selectedTower);
      this.selectedTower = null;
    }
  }

  /**
   * Private Method
   */
  getCellPosition(event: MouseEvent): { row: number; col: number } {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const col = Math.max(0, Math.floor(mouseX / this.gameBoard.cellSize));
    const row = Math.max(0, Math.floor(mouseY / this.gameBoard.cellSize));
    return { row, col };
  }

  /**
   * Spawn Waves of monsters
   */
  spawnMonsterWave(): void {
    this.gameBoard.spawnMonsterWave();
  }
  /**
   * Update Game
   */

  /**
   * Render Game
   */
}
