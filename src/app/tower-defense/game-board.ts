export default class GameBoard {
  gridSize = 10;
  grid: Array<Array<Cell>> = [];
  context!: CanvasRenderingContext2D;
  monsterWaves: Array<number> = [5, 10, 15];
  currentMonsterWaveIndex: number = 0;
  difficulty: number = 0;
  activeMonsters: Array<Monster> = [];
  monsterSpawnCellPosition: { x: number; y: number } = { x: 15, y: 15 };
  monsterWayPoints = [
    { x: 465, y: 15 },
    { x: 465, y: 115 },
    { x: 15, y: 215 },
    { x: 465, y: 215 },
    { x: 465, y: 315 },
    { x: 15, y: 315 },
    { x: 15, y: 415 },
    { x: 465, y: 415 },
    { x: 465, y: 455 },
  ];
  archerTowers: Array<ArcherTowerCell> = [];
  towerPlacementMode: boolean = false;

  constructor(context: CanvasRenderingContext2D | null) {
    if (context) {
      this.context = context;
      this.initializeGrid();
    }
  }

  render(): void {
    const archerTowerCells: Array<ArcherTowerCell> = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.grid[row][col];
        if (cell instanceof ArcherTowerCell) {
          archerTowerCells.push(cell);
        } else {
          cell.draw(this.context);
        }
      }
    }
    // Draw ArcherTowerCell instances at the end
    for (const archerTowerCell of archerTowerCells) {
      archerTowerCell.draw(this.context);
    }
  }

  initializeGrid(): void {
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        this.grid[row][col] = new EmtpyCell(row, col);
        if (row % 2 == 0) {
          this.grid[row][col] = new PathCell(row, col);
        }
      }
    }
    // Set path cell that connect path cell row
    this.grid[1][this.gridSize - 1] = new PathCell(1, this.gridSize - 1);
    this.grid[3][0] = new PathCell(3, 0);
    this.grid[5][this.gridSize - 1] = new PathCell(5, this.gridSize - 1);
    this.grid[7][0] = new PathCell(7, 0);
    // Set starting point
    this.grid[0][0] = new StartPointCell(0, 0);
    // Set exit point
    this.grid[9][9] = new ExitPointCell(9, 9);
  }

  setCell(cell: Cell) {
    this.grid[cell.row][cell.col] = cell;
  }

  startWave() {
    this.spawnMonster();
    this.monsterWaves[this.currentMonsterWaveIndex]--;
    const intervalId = setInterval(() => {
      const monsterCount = this.monsterWaves[this.currentMonsterWaveIndex];
      if (monsterCount > 0) {
        this.spawnMonster();
        this.monsterWaves[this.currentMonsterWaveIndex]--;
      } else {
        clearInterval(intervalId); // Stop the interval when all monsters are spawned
      }
    }, 2000);
  }

  spawnMonster() {
    switch (this.difficulty) {
      case 0:
        this.activeMonsters.push(
          new Monster(this.monsterSpawnCellPosition, 40, 1)
        );
        break;
      case 1:
        this.activeMonsters.push(
          new Monster(this.monsterSpawnCellPosition, 40, 1.5)
        );
        break;
      case 2:
        this.activeMonsters.push(
          new Monster(this.monsterSpawnCellPosition, 60, 1.5)
        );
        break;
      default:
        throw new Error('Invalid difficulty level');
    }
  }

  isEmtpyCell(row: number, col: number): boolean {
    return this.grid[row][col] instanceof EmtpyCell;
  }
}

class Monster {
  cellSize = 20;
  movementSpeed;
  position: { x: number; y: number };
  maxHealth: number;
  currentHealth: number;
  currentWaypointIndex: number = 0;
  constructor(
    position: { x: number; y: number },
    maxHealth: number,
    movementSpeed: number
  ) {
    this.position = { ...position };
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.movementSpeed = movementSpeed;
  }

  draw(context: CanvasRenderingContext2D): void {
    const healthBarHeight = 4;
    const healthBarWidth = this.cellSize;
    const healthBarY = this.position.y - healthBarHeight - 2; // Adjust the vertical position of the health bar

    // Draw the monster
    context.fillStyle = 'brown';
    context.fillRect(
      this.position.x,
      this.position.y,
      this.cellSize,
      this.cellSize
    );

    // Draw the health bar
    const healthPercentage = Math.max(0, this.currentHealth) / this.maxHealth; // Ensure the percentage is between 0 and 1
    const healthBarColor = this.getHealthBarColor(healthPercentage);
    context.fillStyle = healthBarColor;
    context.fillRect(
      this.position.x,
      healthBarY,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
  }

  // Helper function to get health bar color based on percentage
  getHealthBarColor(percentage: number): string {
    const hue = percentage * 120; // 0% health is green, 100% health is red
    return `hsl(${hue}, 100%, 50%)`;
  }
}

export enum CellType {
  Empty = 'empty',
  Start = 'start',
  Exit = 'exit',
  Path = 'path',
  ArcherTower = 'archer-tower',
}

export const CELL_SIZE = 50;
export class Cell {
  row: number;
  col: number;
  x: number;
  y: number;
  type: CellType;
  cellSize: number = CELL_SIZE;
  isHovered: boolean = false;
  constructor(row: number, col: number, type: CellType) {
    this.row = row;
    this.col = col;
    this.type = type;
    this.x = this.col * CELL_SIZE;
    this.y = this.row * CELL_SIZE;
  }
  updatePosition(): void {}

  draw(context: CanvasRenderingContext2D): void {
    context.fillRect(this.x, this.y, this.cellSize, this.cellSize);
  }
}

export class EmtpyCell extends Cell {
  constructor(row: number, col: number) {
    super(row, col, CellType.Empty);
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'white';
    super.draw(context);
  }
}
export class ArcherTowerCell extends Cell {
  override cellSize: number = 20;
  override x = this.col * CELL_SIZE + 15;
  override y = this.row * CELL_SIZE + 15;
  attackRange: number = 70;
  attackPower: number = 10;
  initialMoneyCost: number = 10;
  constructor(row: number = 0, col: number = 0) {
    super(row, col, CellType.ArcherTower);
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'green';
    super.draw(context);

    // Draw the attack range circle
    context.beginPath();
    context.strokeStyle = 'lightblue';
    context.arc(
      this.x + this.cellSize / 2,
      this.y + this.cellSize / 2,
      this.attackRange,
      0,
      2 * Math.PI
    );
    context.stroke();
  }

  override updatePosition(): void {
    this.x = this.col * CELL_SIZE + 15;
    this.y = this.row * CELL_SIZE + 15;
  }
}

class PathCell extends Cell {
  constructor(row: number, col: number) {
    super(row, col, CellType.Path);
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'gray';
    super.draw(context);
  }
}

class StartPointCell extends Cell {
  constructor(row: number, col: number) {
    super(row, col, CellType.Start);
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'black';
    super.draw(context);
  }
}

class ExitPointCell extends Cell {
  constructor(row: number, col: number) {
    super(row, col, CellType.Exit);
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'blue';
    super.draw(context);
  }
}

export class Arrow {
  x: number;
  y: number;
  target: Monster;
  speed: number;
  damage: number;

  constructor(
    x: number,
    y: number,
    target: Monster,
    speed: number,
    damage: number
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
  }

  update(): void {
    // Move the arrow towards the target
    const dx = this.target.position.x - this.x;
    const dy = this.target.position.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the direction vector
    const directionX = dx / distance;
    const directionY = dy / distance;

    // Move the arrow based on its speed
    this.x += directionX * this.speed;
    this.y += directionY * this.speed;
  }

  draw(context: CanvasRenderingContext2D): void {
    // Draw the arrow as a circle
    context.beginPath();
    context.fillStyle = 'black';

    // The circle is drawn centered around this.x, this.y
    const circleRadius = 5; // Adjust the circle radius as needed

    context.arc(this.x, this.y, circleRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}
