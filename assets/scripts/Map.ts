import { _decorator, Component, Layers, Node, SpriteFrame, Input, resources, Prefab, instantiate, Vec3, tween, UIOpacity, UITransform } from 'cc';
import { Tile } from './Tile';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('Map')
export class Map extends Component {
    @property([SpriteFrame])
    objectSprites: SpriteFrame[] = [];

    @property(SpriteFrame)
    tileBGSprite: SpriteFrame | null = null;

    @property(Prefab)
    starPrefab: Prefab | null = null;

    @property(Prefab)
    linePrefab: Prefab | null = null;

    @property(Node)
    lineNode: Node | null = null;

    @property(Node)
    starNode: Node | null = null;

    @property(AudioManager)
    audioManager: AudioManager | null = null;

    private rows: number = 6;
    private cols: number = 10;
    private tileSize: number = 150;
    private firstSelected: Tile | null = null;
    private tiles: Tile[][] = [];

    start() {
        // Initialize audio
        if (this.audioManager) {
            this.audioManager.playBackgroundMusic();
        }

        // Load resources
        resources.load("Tile/icon_tile/spriteFrame", SpriteFrame, (err, asset) => {
            if (err) {
                console.error("Failed to load tile background:", err);
                return;
            }
            this.tileBGSprite = asset;
            this.loadObjectSprites();
        });
    }

    private loadObjectSprites() {
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
        this.tiles = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

        const startX = -this.cols * this.tileSize / 2;
        const startY = this.rows * this.tileSize / 2;

        // Generate sprite pool
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

        pool = this.shuffleArray(pool);

        // Create tiles
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const tileNode = new Node(`Tile_${i}_${j}`);
                tileNode.layer = Layers.Enum.UI_2D;
                tileNode.setPosition(startX + j * this.tileSize, startY - i * this.tileSize, 0);

                // Add Tile component
                const tile = tileNode.addComponent(Tile);
                if (this.tileBGSprite) {
                    tile.init(i, j, this.tileBGSprite, pool[i * this.cols + j], this.tileSize);
                }

                this.tiles[i][j] = tile;

                // Handle click events
                tileNode.on(Input.EventType.TOUCH_START, () => {
                    this.handleTileClick(tile);
                }, this);

                this.node.addChild(tileNode);
            }
        }
    }

    handleTileClick(tile: Tile) {
        if (!tile.getIconSprite()) return;

        // Play click sound
        if (this.audioManager) {
            this.audioManager.playClickSound();
        }

        // First selection
        if (this.firstSelected === null) {
            this.firstSelected = tile;
            tile.select();
            return;
        }

        // Same tile clicked
        if (this.firstSelected === tile) {
            this.firstSelected.deselect();
            this.firstSelected = null;
            return;
        }

        // Second selection
        if (this.firstSelected.getIconSprite() === tile.getIconSprite()) {
            const path = this.canConnect(this.firstSelected, tile);
            if (path) {
                // Play match sound
                if (this.audioManager) {
                    this.audioManager.playMatchSound();
                }

                // Draw connection
                for (let i = 0; i < path.length - 1; i++) {
                    this.spawnLine(path[i], path[i + 1]);
                }
                path.forEach(pos => {
                    this.spawnStar(pos);
                });

                // Remove tiles
                const firstPos = this.firstSelected.getGridPosition();
                const secondPos = tile.getGridPosition();
                
                this.tiles[firstPos.row][firstPos.col] = null;
                this.tiles[secondPos.row][secondPos.col] = null;

                this.firstSelected.destroyWithAnimation();
                tile.destroyWithAnimation();
            } else {
                this.firstSelected.deselect();
            }
        } else {
            this.firstSelected.deselect();
        }

        this.firstSelected = null;
    }

    private canConnect(a: Tile, b: Tile): { r: number, c: number }[] | null {
        const posA = a.getGridPosition();
        const posB = b.getGridPosition();

        // Grid có viền: 0 = trống, 1 = tile
        const R = this.rows + 2;
        const C = this.cols + 2;
        const grid: number[][] = Array.from({ length: R }, () => Array(C).fill(0));

        // Fill grid with existing tiles
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.tiles[i][j] !== null) {
                    grid[i + 1][j + 1] = 1;
                }
            }
        }

        // Start and end positions (shift +1 for border)
        const sr = posA.row + 1, sc = posA.col + 1;
        const tr = posB.row + 1, tc = posB.col + 1;
        grid[sr][sc] = 0;
        grid[tr][tc] = 0;

        type State = { r: number, c: number, dir: number, turns: number, path: {r:number,c:number}[] };
        const dirs = [
            [1, 0],   // down
            [-1, 0],  // up
            [0, 1],   // right
            [0, -1],  // left
        ];

        const INF = 99;
        const bestTurns = Array.from({ length: R }, () =>
            Array.from({ length: C }, () => Array(4).fill(INF))
        );

        const queue: State[] = [];

        // Try all 4 directions from start
        for (let d = 0; d < 4; d++) {
            bestTurns[sr][sc][d] = 0;
            queue.push({ r: sr, c: sc, dir: d, turns: 0, path: [{r: sr, c: sc}] });
        }

        while (queue.length > 0) {
            const cur = queue.shift()!;

            const [dr, dc] = dirs[cur.dir];
            let nr = cur.r + dr;
            let nc = cur.c + dc;
            let pathCopy = [...cur.path];

            while (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 0) {
                pathCopy = [...pathCopy, {r: nr, c: nc}];
                if (nr === tr && nc === tc) return pathCopy;

                if (bestTurns[nr][nc][cur.dir] > cur.turns) {
                    bestTurns[nr][nc][cur.dir] = cur.turns;
                    
                    for (let nd = 0; nd < 4; nd++) {
                        const newTurns = cur.dir === nd ? cur.turns : cur.turns + 1;
                        if (newTurns <= 2 && bestTurns[nr][nc][nd] > newTurns) {
                            bestTurns[nr][nc][nd] = newTurns;
                            queue.push({ r: nr, c: nc, dir: nd, turns: newTurns, path: [...pathCopy] });
                        }
                    }
                }

                nr += dr;
                nc += dc;
            }
        }

        return null;
    }

    private spawnStar(gridPos: { r: number, c: number }) {
        if (!this.starPrefab || !this.starNode) return;

        const star = instantiate(this.starPrefab);
        star.layer = Layers.Enum.UI_2D;

        const x = -this.cols * this.tileSize / 2 + (gridPos.c - 1) * this.tileSize;
        const y = this.rows * this.tileSize / 2 - (gridPos.r - 1) * this.tileSize;

        star.setPosition(new Vec3(x, y, 0));
        this.starNode.addChild(star);

        tween(star)
            .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
            .to(0.3, { scale: new Vec3(0, 0, 1) })
            .call(() => star.destroy())
            .start();
    }

    private spawnLine(from: { r: number, c: number }, to: { r: number, c: number }) {
        if (!this.linePrefab || !this.lineNode) return;

        const line = instantiate(this.linePrefab);
        line.layer = Layers.Enum.UI_2D;

        const x1 = -this.cols * this.tileSize / 2 + (from.c - 1) * this.tileSize;
        const y1 = this.rows * this.tileSize / 2 - (from.r - 1) * this.tileSize;
        const x2 = -this.cols * this.tileSize / 2 + (to.c - 1) * this.tileSize;
        const y2 = this.rows * this.tileSize / 2 - (to.r - 1) * this.tileSize;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        line.setPosition(new Vec3(midX, midY, 0));

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        line.setRotationFromEuler(0, 0, angle);

        const uiTrans = line.getComponent(UITransform);
        if (uiTrans) {
            uiTrans.setContentSize(length, uiTrans.contentSize.height);
        }

        this.lineNode.addChild(line);

        const opacity = line.getComponent(UIOpacity) || line.addComponent(UIOpacity);
        opacity.opacity = 255;
        tween(opacity)
            .to(0.5, { opacity: 0 })
            .call(() => line.destroy())
            .start();
    }

    shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}