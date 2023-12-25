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

  @ViewChild('testCanvas', { static: true })
  testCanvas!: ElementRef<HTMLCanvasElement>;

  context!: CanvasRenderingContext2D;
  gameBoard!: GameBoard;
  activeArrows: Array<Arrow> = [];

  CellType = CellType;
  hoveredCell: Cell | null = null;
  errorMessage: string = '';

  drawTestCanvas(): void {
    const context = this.testCanvas.nativeElement.getContext('2d');
    if (context) {
      // Draw the attack range circle
      context.beginPath();
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.arc(50 + 50 / 2, 50 + 50 / 2, 60, 0, 2 * Math.PI);
      context.stroke();
    }
  }
  ngOnInit(): void {
    this.drawTestCanvas();
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
      this.updateMonsterWave();

      // Update per second
      if (elapsedTime > 1000) {
        console.log({
          elapsedSecond: Math.floor(timeStamp / 1000),
        });
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

  updateMonsterWave(): void {
    const speed = 1;
    this.gameBoard.monsterWave.forEach((monster) => {
      if (
        monster.currentWaypointIndex < this.gameBoard.monsterWayPoints.length
      ) {
        const targetWaypoint =
          this.gameBoard.monsterWayPoints[monster.currentWaypointIndex];
        const xDistance = targetWaypoint.x - monster.position.x;
        const yDistance = targetWaypoint.y - monster.position.y;
        // Move towards the target waypoint
        if (xDistance !== 0) {
          if (xDistance > 0) {
            monster.position.x += speed;
          } else {
            monster.position.x -= speed;
          }
        } else if (yDistance !== 0) {
          if (yDistance > 0) {
            monster.position.y += speed;
          } else {
            monster.position.y -= speed;
          }
        } else {
          // Reached the target waypoint, move to the next one
          monster.currentWaypointIndex++;
          console.log(
            "Update monster's current waypoint",
            monster.currentWaypointIndex,
            this.gameBoard.monsterWayPoints[monster.currentWaypointIndex]
          );
        }
        monster.draw(this.context);
      }
    });
    this.gameBoard.monsterWave = this.gameBoard.monsterWave.filter(
      (monster) => monster.health > 0
    );
  }

  updateArcherTower(): void {
    if (this.gameBoard.archerTowers.length > 0) {
      console.log('Archer Tower Attacked', this.gameBoard.archerTowers);
    }
    this.gameBoard.archerTowers.forEach((archerTower) => {
      for (let monster of this.gameBoard.monsterWave) {
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
          monster.health -= archerTower.attackPower;
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
        this.hoveredCell = null;
        this.gameBoard.towerPlacementMode = false;
      }
    } else {
      this.errorMessage = 'Please select a tower below';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  onSelectArcherTower(): void {
    this.gameBoard.towerPlacementMode = true;
    this.hoveredCell = new ArcherTowerCell();
  }

  onCancelSelectTower(): void {
    this.gameBoard.towerPlacementMode = false;
    this.hoveredCell = null;
  }

  onStartWave(): void {
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
