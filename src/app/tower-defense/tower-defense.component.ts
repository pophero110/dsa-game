import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import GameBoard, {
  ArcherTowerCell,
  Arrow,
  CELL_SIZE,
  Cell,
  CellType,
  EmtpyCell,
} from './game-board';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  standalone: true,
  templateUrl: './tower-defense.component.html',
  styleUrls: ['./tower-defense.component.css'],
})
export class TowerDefenseComponent {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  context!: CanvasRenderingContext2D;
  gameBoard!: GameBoard;
  gameState: string = 'not started';
  availableMoney: number = 20;
  activeArrows: Array<Arrow> = [];

  CellType = CellType;
  hoveredCell: Cell | null = null;
  errorMessage: string = '';

  ngOnInit(): void {
    // Initialize game
    const context = this.canvas.nativeElement.getContext('2d');
    if (context) {
      this.context = context;
    }
    this.gameBoard = new GameBoard(this.context);
    let lastTimeStamp = 0;
    // Update & Render game
    const gameLoop = (timeStamp: number) => {
      const elapsedTime = timeStamp - lastTimeStamp;
      this.clearCanvas();
      this.gameBoard.render();
      this.updateActiveMonsters();
      // Update per second
      if (elapsedTime > 1000) {
        this.updateMonsterWaves();
        this.updateArcherTower();
        lastTimeStamp = timeStamp;
      }
      this.updateArrows();
      window.requestAnimationFrame(gameLoop);
    };
    window.requestAnimationFrame(gameLoop);
  }

  // Remove hover effect
  // TODO: remove if possible
  clearCanvas(): void {
    this.context.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
  }

  updateMonsterWaves(): void {
    if (
      this.gameBoard.activeMonsters.length === 0 &&
      this.gameState == 'started'
    ) {
      this.gameBoard.currentMonsterWaveIndex++;
      this.gameBoard.difficulty++;
      if (
        this.gameBoard.currentMonsterWaveIndex >=
        this.gameBoard.monsterWaves.length
      ) {
        this.gameState = 'finished';
        console.log('Game finished');
        return;
      }
      this.gameBoard.startWave();
    }
  }

  updateActiveMonsters(): void {
    this.gameBoard.activeMonsters.forEach((monster) => {
      if (
        monster.currentWaypointIndex < this.gameBoard.monsterWayPoints.length
      ) {
        const targetWaypoint =
          this.gameBoard.monsterWayPoints[monster.currentWaypointIndex];
        let xDistance = Math.floor(targetWaypoint.x - monster.position.x);
        let yDistance = Math.floor(targetWaypoint.y - monster.position.y);
        if (xDistance === -1 || xDistance === 1) xDistance = 0;
        if (yDistance === -1 || yDistance === 1) yDistance = 0;
        // Move towards the target waypoint
        if (xDistance !== 0) {
          if (xDistance > 0) {
            monster.position.x += monster.movementSpeed;
          } else {
            monster.position.x -= monster.movementSpeed;
          }
        } else if (yDistance !== 0) {
          if (yDistance > 0) {
            monster.position.y += monster.movementSpeed;
          } else {
            monster.position.y -= monster.movementSpeed;
          }
        } else {
          // Reached the target waypoint, move to the next one
          monster.currentWaypointIndex++;
        }
        monster.draw(this.context);
      }
    });
    this.gameBoard.activeMonsters = this.gameBoard.activeMonsters.filter(
      (monster) => {
        if (monster.currentHealth > 0) {
          return true;
        } else {
          this.availableMoney += 5;
          console.log('Positive Feadback: Gain Coins');
          return false;
        }
      }
    );
  }

  updateArcherTower(): void {
    this.gameBoard.archerTowers.forEach((archerTower) => {
      for (let monster of this.gameBoard.activeMonsters) {
        const distance = Math.sqrt(
          Math.pow(monster.position.x - archerTower.x, 2) +
            Math.pow(monster.position.y - archerTower.y, 2)
        );

        if (distance <= archerTower.attackRange) {
          const arrow = new Arrow(
            archerTower.x,
            archerTower.y,
            monster,
            5,
            archerTower.attackPower
          );

          // Add the arrow to a list of active arrows
          this.activeArrows.push(arrow);
          monster.currentHealth -= archerTower.attackPower;
          break;
        }
      }
    });
  }

  updateArrows() {
    for (const arrow of this.activeArrows) {
      arrow.update();
      arrow.draw(this.context);
    }

    // Remove arrows that have reached their target
    this.activeArrows = this.activeArrows.filter((arrow) => {
      const distanceToTarget = Math.sqrt(
        (arrow.target.position.x - arrow.x) ** 2 +
          (arrow.target.position.y - arrow.y) ** 2
      );
      return distanceToTarget > 5; // Remove arrows when they are close to the target
    });
  }

  /**
   * Process Input: Listen to host element envent
   * TODO: reduce event trigger times
   */
  @HostListener('mousemove', ['$event'])
  setHoveredCellPosition(event: MouseEvent): void {
    // Only select canvas element with a selected tower
    if (event.target !== this.canvas.nativeElement) {
      return;
    }
    if (this.gameBoard.towerPlacementMode && this.hoveredCell) {
      const { row, col } = this.getCellPosition(event);
      const previousHoveredCell = this.hoveredCell;
      // if within same cell, return
      if (previousHoveredCell.row == row && previousHoveredCell.col == col) {
        return;
      }
      if (previousHoveredCell.isHovered) {
        const emptyCell = new EmtpyCell(
          previousHoveredCell.row,
          previousHoveredCell.col
        );
        this.gameBoard.setCell(emptyCell);
      }
      if (this.gameBoard.isEmtpyCell(row, col)) {
        this.hoveredCell.row = row;
        this.hoveredCell.col = col;
        this.hoveredCell.updatePosition();
        this.hoveredCell.isHovered = true;
        this.gameBoard.setCell(this.hoveredCell);
      }
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeaveCanvas(event: MouseEvent): void {
    if (this.hoveredCell) {
      const emtpyCell = new EmtpyCell(
        this.hoveredCell.row,
        this.hoveredCell.col
      );
      this.gameBoard.setCell(emtpyCell);
    }
  }

  @HostListener('click', ['$event'])
  onClickTowerPlacement(event: MouseEvent): void {
    if (event.target !== this.canvas.nativeElement) return;
    if (this.gameBoard.towerPlacementMode && this.hoveredCell) {
      if (this.hoveredCell instanceof ArcherTowerCell) {
        this.gameBoard.setCell(this.hoveredCell);
        this.gameBoard.archerTowers.push(this.hoveredCell);
        this.availableMoney -= this.hoveredCell.initialMoneyCost;
        this.hoveredCell = null;
        this.gameBoard.towerPlacementMode = false;
      }
    } else {
      this.updateErrorMessage('Please select a tower below');
    }
  }

  updateErrorMessage(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }

  onSelectArcherTower(): void {
    if (this.availableMoney < 10) {
      this.updateErrorMessage('Not enough money');
      return;
    }
    this.gameBoard.towerPlacementMode = true;
    this.hoveredCell = new ArcherTowerCell();
  }

  onCancelSelectTower(): void {
    this.gameBoard.towerPlacementMode = false;
    this.hoveredCell = null;
  }

  onStartGame(): void {
    this.gameState = 'started';
    this.gameBoard.startWave();
  }

  /**
   * Private Method
   */
  getCellPosition(event: MouseEvent): { row: number; col: number } {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const col = Math.max(0, Math.floor(mouseX / CELL_SIZE));
    const row = Math.max(0, Math.floor(mouseY / CELL_SIZE));
    return { row, col };
  }
}
