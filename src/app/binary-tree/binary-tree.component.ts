import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
  selector: 'app-binary-tree',
  standalone: true,
  templateUrl: './binary-tree.component.html',
  styleUrl: './binary-tree.component.css',
})
export class BinaryTreeComponent {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  private context!: CanvasRenderingContext2D | null;
  private rootNode!: TreeNode;

  ngOnInit(): void {
    this.setupCanvas();
    this.drawCircle();
    this.context = this.canvas.nativeElement.getContext('2d');
    this.rootNode = this.createSampleTree();
    this.drawTree(
      this.rootNode,
      this.canvas.nativeElement.width / 2,
      50,
      50,
      50
    );
  }

  drawCircle(): void {
    const canvas = this.canvas.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 50;

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      context.fillStyle = 'blue'; // Set the circle fill color
      context.fill();
      context.stroke(); // Optional: Add this line if you want to draw the circle border
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.setupCanvas();
  }

  setupCanvas(): void {
    const canvas = this.canvas.nativeElement;
    const context = canvas.getContext('2d');

    // Set canvas dimensions based on window size
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    canvas.width = windowWidth;
    canvas.height = windowHeight;

    // Additional setup (drawing, etc.) can be performed here using the 'context' object
    if (context) {
      context.fillStyle = 'lightblue';
      context.fillRect(0, 0, windowWidth, windowHeight);
      this.drawCircle();
    }
  }

  createSampleTree(): TreeNode {
    return {
      value: 10,
      left: {
        value: 5,
        left: { value: 3 },
        right: { value: 7 },
      },
      right: {
        value: 15,
        left: { value: 12 },
        right: { value: 18 },
      },
    };
  }

  drawTree(
    node: TreeNode | undefined,
    x: number,
    y: number,
    dx: number,
    dy: number
  ): void {
    if (node) {
      // Draw current node
      this.drawNode(x, y, node.value);

      // Draw left child and connecting line
      if (node.left) {
        this.drawTree(node.left, x - dx, y + dy, dx / 2, dy);
        this.drawConnectingLine(x, y, x - dx, y + dy);
      }

      // Draw right child and connecting line
      if (node.right) {
        this.drawTree(node.right, x + dx, y + dy, dx / 2, dy);
        this.drawConnectingLine(x, y, x + dx, y + dy);
      }
    }
  }

  drawNode(x: number, y: number, value: number): void {
    if (this.context) {
      this.context.fillStyle = 'lightblue';
      this.context.strokeStyle = 'black';
      this.context.beginPath();
      this.context.arc(x, y, 20, 0, 2 * Math.PI);
      this.context.fill();
      this.context.stroke();

      this.context.fillStyle = 'black';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText(value.toString(), x, y);
    }
  }

  drawConnectingLine(x1: number, y1: number, x2: number, y2: number): void {
    if (this.context) {
      this.context.strokeStyle = 'black';
      this.context.beginPath();
      this.context.moveTo(x1, y1 + 20);
      this.context.lineTo(x2, y2 - 20);
      this.context.stroke();
    }
  }
}

interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
}
