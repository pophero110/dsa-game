export default class GameBoard {
  gridSize = 10;
  cellSize = 50;
  hoveredTowerPlacement: { row: number; col: number } | null = null;
  spawnPoint: { row: number; col: number } = { row: 0, col: 0 };
  exitPoint: { row: number; col: number } = { row: 9, col: 9 };
  cells: Array<Array<{ row: number; col: number; type: CellType }>> = [];
  context!: CanvasRenderingContext2D;
  monsterWave: Array<Monster> = [];

  constructor(context: CanvasRenderingContext2D | null) {
    if (context) {
      this.context = context;
      this.initializeGrid();
    }
  }

  render(): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.drawCell(col, row, this.cells[row][col].type);
      }
    }
  }

  initializeGrid(): void {
    for (let row = 0; row < this.gridSize; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        this.cells[row][col] = { row, col, type: CellType.Empty };
        if (row % 2 == 0) {
          this.cells[row][col].type = CellType.Path;
        }
      }
    }
    // Set path cell that connect path cell row
    this.cells[1][this.gridSize - 1].type = CellType.Path;
    this.cells[3][0].type = CellType.Path;
    this.cells[5][this.gridSize - 1].type = CellType.Path;
    this.cells[7][0].type = CellType.Path;
    // Set starting point
    this.cells[this.spawnPoint.row][this.spawnPoint.col].type = CellType.Start;
    // Set exit point
    this.cells[this.exitPoint.row][this.exitPoint.col].type = CellType.Exit;
  }

  drawCell(col: number, row: number, type: CellType): void {
    switch (type) {
      case CellType.Start:
        this.context.fillStyle = 'black';
        break;
      case CellType.Exit:
        this.context.fillStyle = 'blue';
        break;
      case CellType.Path:
        this.context.fillStyle = 'gray';
        break;
      case CellType.ArcherTower:
        this.context.fillStyle = 'green';
        break;
      default:
        this.context.fillStyle = 'white';
    }

    this.context.fillRect(
      col * this.cellSize,
      row * this.cellSize,
      this.cellSize,
      this.cellSize
    );
  }

  placeTower(row: number, col: number, selectedTower: CellType) {
    this.cells[row][col] = { row, col, type: selectedTower };
    this.drawCell(col, row, selectedTower);
  }

  spawnMonsterWave() {
    const numberOfMonster = 1;
    for (let i = 0; i < numberOfMonster; i++) {
      let monster = new Monster(15, 15);
      this.monsterWave.push(monster);
      this.drawMonster(monster);
    }
  }

  drawMonster(monster: Monster) {
    this.context.fillStyle = 'red';
    this.context.fillRect(
      monster.position.x,
      monster.position.y,
      monster.cellSize,
      monster.cellSize
    );
  }
}

class Monster {
  cellSize = 20;
  position!: { x: number; y: number };
  constructor(x: number, y: number) {
    this.position = { x, y };
  }
}

export enum CellType {
  Empty = 'empty',
  Start = 'start',
  Exit = 'exit',
  Path = 'path',
  ArcherTower = 'archer-tower',
}
