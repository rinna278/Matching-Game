import { _decorator, Component, Layers, Node, Sprite, SpriteFrame, UITransform, Input, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Map')
export class Map extends Component {
    @property([SpriteFrame])
    objectSprites: SpriteFrame[] = [];

    private rows: number = 6;
    private cols: number = 10;
    private tileSize: number = 150;

    // Lưu tile được chọn lần đầu
    private firstSelected: Node | null = null;


    start() {
        resources.loadDir('Cake', SpriteFrame, (err, assets) => {
            if (err) {
                console.error('Failed to load assets:', err);
                return;
            }
            this.objectSprites = assets;
            this.generateMap();
            console.log("Map generated successfully");
        });

    }

    generateMap() {
        this.node.setScale(0.5, 0.5, 1);

        const startX = -this.cols * this.tileSize / 2;
        const startY = this.rows * this.tileSize / 2;


        let pool: SpriteFrame[] = [];
        let set: Set<number> = new Set();
        for (let i = 0; i < 15; i++) {
            let randomIndex = Math.floor(Math.random() * this.objectSprites.length);
            while (set.has(randomIndex)) {
                randomIndex = Math.floor(Math.random() * this.objectSprites.length);
            }

            for (let k = 0; k < 4; k++) {
                pool.push(this.objectSprites[randomIndex]);
            }
            set.add(randomIndex);
        }

        // Trộn mảng để tạo vị trí ngẫu nhiên
        pool = this.shuffleArray(pool);

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const tileNode = new Node(`Tile_${i}_${j}`); // từ (0,0) đến (5,9)
                tileNode.layer = Layers.Enum.UI_2D;
                tileNode.setPosition(startX + j * this.tileSize, startY - i * this.tileSize, 0);

                // Thêm sprite vào ô
                const sprite = tileNode.addComponent(Sprite);
                sprite.spriteFrame = pool[i * this.cols + j];

                // Thêm kích thước để bắt sự kiện
                tileNode.addComponent(UITransform).setContentSize(this.tileSize, this.tileSize);

                // Bắt sự kiện click
                tileNode.on(Input.EventType.TOUCH_START, () => {
                    this.handleTileClick(tileNode);
                }, this);

                this.node.addChild(tileNode);
            }
        }
    }

    handleTileClick(tile: Node) {
        const sprite = tile.getComponent(Sprite);
        if (!sprite || !sprite.spriteFrame) return;

        // Nếu chưa chọn ô nào
        if (this.firstSelected === null) {
            this.firstSelected = tile;
            tile.setScale(1.2, 1.2, 1); // highlight
            return;
        }

        // Nếu chọn cùng 1 ô thì bỏ qua
        if (this.firstSelected === tile) {
            this.firstSelected.setScale(1, 1, 1);
            this.firstSelected = null;
            return;
        }

        // Nếu chọn ô thứ 2
        const firstSprite = this.firstSelected.getComponent(Sprite);
        console.log(firstSprite)
        if (firstSprite && firstSprite.spriteFrame === sprite.spriteFrame) {
            if (this.canConnect(this.firstSelected, tile)) {
                this.firstSelected.destroy();
                tile.destroy();
            } else {
                this.firstSelected.setScale(1,1,1);
            }
        } else {
            this.firstSelected.setScale(1, 1, 1);
        }

        this.firstSelected = null; // reset chọn
    }

    shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            // Chọn chỉ số ngẫu nhiên từ 0 đến i
            const j = Math.floor(Math.random() * (i + 1));
            // Hoán đổi array[i] với array[j]
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // bfs to check can connect
    private canConnect(a: Node, b: Node): boolean {
        // Lấy vị trí 2 điểm
        const [rowA, colA] = a.name.split("_").slice(1).map(Number);
        const [rowB, colB] = b.name.split("_").slice(1).map(Number);

        // Grid có viền: 0 = trống, 1 = tile
        const R = this.rows + 2;
        const C = this.cols + 2;
        const grid: number[][] = Array.from({ length: R }, () => Array(C).fill(0));

        this.node.children.forEach(child => {
            if (child.name.startsWith("Tile")) {
                const [r, c] = child.name.split("_").slice(1).map(Number);
                grid[r + 1][c + 1] = 1; // +1 để dịch vào trong (do thêm viền)
            }
        });

        // điểm bắt đầu & kết thúc (dịch +1 do viền)
        const sr = rowA + 1, sc = colA + 1;
        const tr = rowB + 1, tc = colB + 1;
        grid[sr][sc] = 0;
        grid[tr][tc] = 0;

        type State = { r: number, c: number, dir: number, turns: number };
        const dirs = [
            [1, 0],   // xuống
            [-1, 0],  // lên
            [0, 1],   // phải
            [0, -1],  // trái
        ];

        // bestTurns[r][c][dir] = số rẽ ít nhất để đến (r,c) từ hướng dir
        const INF = 99;
        const bestTurns = Array.from({ length: R }, () =>
            Array.from({ length: C }, () => Array(4).fill(INF))
        );

        const queue: State[] = [];

        // từ điểm bắt đầu, thử đi theo 4 hướng
        for (let d = 0; d < 4; d++) {
            bestTurns[sr][sc][d] = 0;
            queue.push({ r: sr, c: sc, dir: d, turns: 0 });
        }

        while (queue.length > 0) {
            const cur = queue.shift()!;

            const [dr, dc] = dirs[cur.dir];
            let nr = cur.r + dr;
            let nc = cur.c + dc;

            while (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 0) {
                if (nr === tr && nc === tc) return true; // đến đích

                if (bestTurns[nr][nc][cur.dir] > cur.turns) {
                    bestTurns[nr][nc][cur.dir] = cur.turns;
                    // từ ô này, thử tiếp tục theo 4 hướng khác
                    for (let nd = 0; nd < 4; nd++) {
                        const newTurns = cur.dir === nd ? cur.turns : cur.turns + 1;
                        if (newTurns <= 2 && bestTurns[nr][nc][nd] > newTurns) {
                            bestTurns[nr][nc][nd] = newTurns;
                            queue.push({ r: nr, c: nc, dir: nd, turns: newTurns });
                        }
                    }
                }

                nr += dr;
                nc += dc;
            }
        }

        return false;
    }

}
