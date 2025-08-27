import {
  _decorator,
  Component,
  Layers,
  Node,
  SpriteFrame,
  Input,
  resources,
  Prefab,
  instantiate,
  Vec3,
  tween,
  UIOpacity,
  UITransform,
  ParticleSystem2D,
  ParticleSystem,
  Sprite,
  JsonAsset,
  view,
} from "cc";
import { Tile } from "./Tile";
import { AudioManager } from "./AudioManager";
import { LevelUI } from "./LevelUI";
import { ScoreManager } from "./ScoreManager";

const { ccclass, property } = _decorator;

@ccclass("Map")
export class Map extends Component {
  @property([SpriteFrame])
  objectSprites: SpriteFrame[] = [];

  @property(SpriteFrame)
  tileBGSprite: SpriteFrame | null = null;

  @property(Prefab)
  starPrefab: Prefab | null = null;

  @property(Prefab)
  linePrefab: Prefab | null = null;

  @property(Prefab)
  skeletonPrefab: Prefab | null = null;

  @property(Node)
  lineNode: Node | null = null;

  @property(Node)
  starNode: Node | null = null;

  @property(Node)
  matchEffectNode: Node | null = null;

  @property(Prefab)
  matchEffectPrefab: Prefab | null = null;

  @property(AudioManager)
  audioManager: AudioManager | null = null;

  @property(ScoreManager)
  scoreManager: ScoreManager | null = null;

  private rows: number = 8;
  private cols: number = 14;
  private tileSize: number = 150;
  private firstSelected: Tile | null = null;
  private tiles: Tile[][] = [];
  private themeID: number = 1;
  private lv: number = 1;
  private width: number = 0;
  private height: number = 0;
  private milestoneScore: number[] = [];
  @property(LevelUI)
  levelUI: LevelUI | null = null;

  @property(Node)
  hintNode: Node | null = null;

  setLevel(lv: number) {
    this.lv = lv;
    if (this.levelUI) {
      this.levelUI.setLevel(lv);
    }
  }

  getLevel() {
    return this.lv;
  }

  private getThemePath(id: number): string {
    switch (id) {
      case 1:
        return "Theme/1.Cake";
      case 2:
        return "Theme/2.Food";
      case 3:
        return "Theme/3.Fruits";
      case 4:
        return "Theme/4.Candy";
      case 5:
        return "Theme/5.Cat&dog";
      case 6:
        return "Theme/6.Sport";
      case 7:
        return "Theme/7.Girl clothes";
      default:
        return "Theme/1.Cake"; // fallback
    }
  }

  private getLVPath(lv: number): string {
    return `Level/lv${lv}`;
  }

  // private getBGMPath(id: number): string {
  //     switch (id) {
  //         case 1: return 'Sound/Netherland';
  //         case 2: return 'Sound/Undersea';
  //         // case 3: return 'Audio/BGM/bgm3';
  //     }
  // }
  start() {
    // Get screen size
    this.width = view.getVisibleSize().width;
    this.height = view.getVisibleSize().height;
    // Initialize audio
    if (this.audioManager) {
      this.audioManager.playBackgroundMusic();
    }
    console.log("Screen size:", this.width, this.height);
    this.loadLevel(this.lv);
    this.levelUI?.setLevel(this.lv);
  }

  private loadLevel(lv: number) {
    resources.load(this.getLVPath(lv), JsonAsset, (err, asset) => {
      if (err) {
        console.error("Failed to load map config:", err);
        return;
      }

      const config = asset.json;
      this.rows = config.rows;
      this.cols = config.cols;
      // this.tileSize = config.tileSize;
      this.themeID = config.themeID;
      this.milestoneScore = config.milestoneScore;

      // Load tile background
      const tileBGPath = "Tile/icon_tile/spriteFrame";
      resources.load(tileBGPath, SpriteFrame, (err, tileAsset) => {
        if (err) {
          console.error("Failed to load tile background:", err);
          return;
        }
        this.tileBGSprite = tileAsset;

        // Load theme sprites
        const themePath = this.getThemePath(this.themeID);
        resources.loadDir(themePath, SpriteFrame, (err, assets) => {
          if (err) {
            console.error("Failed to load theme sprites:", err);
            return;
          }
          this.objectSprites = assets;

          this.generateMap();
          console.log(`Map generated with theme: ${themePath}`);
          if (this.scoreManager) {
            this.scoreManager.setMilestoneScore(this.milestoneScore);
            this.scoreManager.resetScore();
          }
        });
      });
    });
  }
  private nextLevel() {
    this.lv++;
    this.clearMap();
    this.loadLevel(this.lv);
  }

  generateMap() {
    // Set milestoneScore for scoreManager
    this.scoreManager?.setMilestoneScore(this.milestoneScore);
    // Calculate tile size based on screen dimensions and grid size
    this.tileSize = Math.min(
      (this.width / (this.cols + 1.5)) * 2,
      (this.height / (this.rows + 1.5)) * 2
    );
    this.levelUI?.setLevel(this.lv);
    const spawnPos = new Vec3(0, 0, 0);
    console.log(`Current level is: ${this.lv}`);
    this.tiles = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null)
    );

    const totalWidth = this.cols * this.tileSize;
    const totalHeight = this.rows * this.tileSize;

    const startX = -totalWidth / 2 + this.tileSize / 2;
    const startY = totalHeight / 2 - this.tileSize / 2;

    // Generate sprite pool
    let pool: SpriteFrame[] = [];
    let set: Set<number> = new Set();
    const numOfSprites = (this.rows * this.cols) / 4;
    for (let i = 0; i < numOfSprites; i++) {
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
        const finalX = startX + j * this.tileSize;
        const finalY = startY - i * this.tileSize;
        const finalPos = new Vec3(finalX, finalY, 0);

        tileNode.setPosition(spawnPos);
        tileNode.setScale(0.01, 0.01, 1);
        // Add Tile component
        const tile = tileNode.addComponent(Tile);
        if (this.tileBGSprite) {
          tile.init(
            i,
            j,
            this.tileBGSprite,
            pool[i * this.cols + j],
            this.tileSize
          );
        }

        // Add skeleton prefab to tile
        if (this.skeletonPrefab) {
          const skeleton = instantiate(this.skeletonPrefab);
          skeleton.setPosition(0, 0, 0);
          const skeletonTransform = skeleton.getComponent(UITransform);
          const scaleX =
            (this.tileSize / skeletonTransform.contentSize.width) * 1.1;
          const scaleY =
            (this.tileSize / skeletonTransform.contentSize.height) * 1.1;
          skeleton.setScale(scaleX, scaleY, 1);
          // skeleton.setScale(1.75, 1.75, 1);
          skeleton.active = false; // Initially inactive

          tileNode.addChild(skeleton);
          tile.skeletonNode = skeleton;
        }

        this.tiles[i][j] = tile;

        // Handle click events
        tileNode.on(
          Input.EventType.TOUCH_START,
          () => {
            this.handleTileClick(tile);
          },
          this
        );

        this.node.addChild(tileNode);
        const delay = (i * this.cols + j) * 0.02; // delay theo index cho đẹp
        tween(tileNode)
          .delay(delay)
          .to(
            1,
            { position: finalPos, scale: new Vec3(1, 1, 1) },
            { easing: "backOut" }
          )
          .start();
      }
    }
  }

  async handleTileClick(tile: Tile) {
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

        this.clearHints();

        await path.forEach((pos, index) => {
          this.spawnStar(pos, index);
          console.log(index);
        });

        // setscale(1,1,1) cho chắc ăn
        this.firstSelected.node.setScale(1, 1, 1);
        // Spawn match effects
        this.spawnMatchEffect(path[0]);
        this.spawnMatchEffect(path[path.length - 1]);
        // Remove tiles
        const firstPos = this.firstSelected.getGridPosition();
        const secondPos = tile.getGridPosition();

        this.tiles[firstPos.row][firstPos.col] = null;
        this.tiles[secondPos.row][secondPos.col] = null;
        this.firstSelected.destroyWithAnimation();
        tile.destroyWithAnimation();

        if (!this.hasValidMoves()) {
          if (this.isWin()) {
            this.win();
          } else {
            this.showGameOverMessage();
            this.reshuffleMap();
          }
        }
      } else {
        this.firstSelected.deselect();
      }
    } else {
      this.firstSelected.deselect();
    }

    this.firstSelected = null;
  }

  private hasValidMoves(): boolean {
    // Check all pairs of tiles with the same icon
    for (let i1 = 0; i1 < this.rows; i1++) {
      for (let j1 = 0; j1 < this.cols; j1++) {
        const tile1 = this.tiles[i1][j1];
        if (!tile1 || !tile1.getIconSprite()) continue;

        for (let i2 = i1; i2 < this.rows; i2++) {
          for (let j2 = i2 === i1 ? j1 + 1 : 0; j2 < this.cols; j2++) {
            const tile2 = this.tiles[i2][j2];
            if (!tile2 || !tile2.getIconSprite()) continue;

            if (tile1.getIconSprite() === tile2.getIconSprite()) {
              if (this.canConnect(tile1, tile2)) {
                return true; // Found a valid move
              }
            }
          }
        }
      }
    }
    return false; // No valid moves found
  }

  private showGameOverMessage() {
    console.log("Game Over! No valid moves left.");
  }

  private isWin() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.tiles[i][j] !== null) {
          return false; // Still tiles left
        }
      }
    }
    return true; // All tiles cleared
  }

  private win() {
    console.log("You win!");
    setTimeout(() => {
      this.nextLevel();
    }, 1500);
  }

  private clearMap() {
    // Remove all existing tile nodes
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.tiles[i][j]) {
          this.tiles[i][j].node.destroy();
          this.tiles[i][j] = null;
        }
      }
    }
    // Clear any remaining lines, stars, or effects
    // if (this.lineNode) this.lineNode.removeAllChildren();
    // if (this.starNode) this.starNode.removeAllChildren();
    // if (this.matchEffectNode) this.matchEffectNode.removeAllChildren();
    // Reset firstSelected
    this.firstSelected = null;
  }

  resetMap() {
    this.clearMap();
    this.generateMap();
    console.log("Map reset successfully");
  }

  private async reshuffleMap() {
    // Lấy tất cả tile còn lại (không null)
    this.clearHints();
    const remainingTiles: Tile[] = [];
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.tiles[i][j] !== null) {
          remainingTiles.push(this.tiles[i][j]);
        }
      }
    }

    const promises = remainingTiles.map((tile) => {
      return new Promise<void>((resolve) => {
        tween(tile.node)
          .to(0.3, { scale: new Vec3(0, 0, 1) }, { easing: "backIn" })
          .call(() => resolve())
          .start();
      });
    });
    await Promise.all(promises);

    // Lấy sprite từ các tile còn lại
    const spriteList: SpriteFrame[] = remainingTiles.map(
      (tile) => tile.getIconSprite()!
    );

    // Shuffle cho tới khi có ít nhất 1 nước đi
    let valid = false;
    let maxTry = 50; // tránh vòng lặp vô hạn
    while (!valid && maxTry > 0) {
      maxTry--;
      this.shuffleArray(spriteList);

      // Gán lại sprite cho các tile
      let index = 0;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          const tile = this.tiles[i][j];
          if (tile) {
            tile.init(
              i,
              j,
              this.tileBGSprite,
              spriteList[index++],
              this.tileSize
            );
            if (tile.skeletonNode) {
              const skeletonNode = tile.skeletonNode;
              skeletonNode.removeFromParent();
              tile.node.addChild(skeletonNode); // Add lại để đúng thứ tự skeleton
            }
            this.firstSelected = null; //bỏ chọn nút đó sau khi reshuffle
            console.log("init successfully");
          }
        }
      }

      if (this.hasValidMoves()) {
        valid = true;
      }
    }

    for (let tile of remainingTiles) {
      tween(tile.node)
        .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
        .start();
    }
    if (maxTry <= 0)
      console.error(
        "Failed to reshuffle map, no valid moves found after maximum attempts."
      );
    else console.log("Reshuffled map successfully, valid moves available.");
  }

  private canConnect(a: Tile, b: Tile): { r: number; c: number }[] | null {
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
    const sr = posA.row + 1,
      sc = posA.col + 1;
    const tr = posB.row + 1,
      tc = posB.col + 1;
    grid[sr][sc] = 0;
    grid[tr][tc] = 0;

    type State = {
      r: number;
      c: number;
      dir: number;
      turns: number;
      path: { r: number; c: number }[];
    };
    const dirs = [
      [1, 0], // down
      [-1, 0], // up
      [0, 1], // right
      [0, -1], // left
    ];

    const INF = 99;
    const bestTurns = Array.from({ length: R }, () =>
      Array.from({ length: C }, () => Array(4).fill(INF))
    );

    const queue: State[] = [];

    // Try all 4 directions from start
    for (let d = 0; d < 4; d++) {
      bestTurns[sr][sc][d] = 0;
      queue.push({ r: sr, c: sc, dir: d, turns: 0, path: [{ r: sr, c: sc }] });
    }

    while (queue.length > 0) {
      const cur = queue.shift()!;

      const [dr, dc] = dirs[cur.dir];
      let nr = cur.r + dr;
      let nc = cur.c + dc;
      let pathCopy = [...cur.path];

      while (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === 0) {
        pathCopy = [...pathCopy, { r: nr, c: nc }];
        if (nr === tr && nc === tc) return pathCopy;

        if (bestTurns[nr][nc][cur.dir] > cur.turns) {
          bestTurns[nr][nc][cur.dir] = cur.turns;

          for (let nd = 0; nd < 4; nd++) {
            const newTurns = cur.dir === nd ? cur.turns : cur.turns + 1;
            if (newTurns <= 2 && bestTurns[nr][nc][nd] > newTurns) {
              bestTurns[nr][nc][nd] = newTurns;
              queue.push({
                r: nr,
                c: nc,
                dir: nd,
                turns: newTurns,
                path: [...pathCopy],
              });
            }
          }
        }

        nr += dr;
        nc += dc;
      }
    }

    return null;
  }

  private spawnMatchEffect(gridPos: { r: number; c: number }) {
    if (!this.matchEffectPrefab || !this.matchEffectNode) return;

    const effect = instantiate(this.matchEffectPrefab);
    effect.layer = Layers.Enum.UI_2D;

    const totalWidth = this.cols * this.tileSize;
    const totalHeight = this.rows * this.tileSize;

    const startX = -totalWidth / 2 + this.tileSize / 2;
    const startY = totalHeight / 2 - this.tileSize / 2;
    const x = startX + (gridPos.c - 1) * this.tileSize;
    const y = startY - (gridPos.r - 1) * this.tileSize;
    effect.setPosition(new Vec3(x, y, 1));
    this.matchEffectNode.addChild(effect);
    const ps = effect.getComponent(ParticleSystem);
    if (ps) {
      (ps as ParticleSystem).play();
    }

    setTimeout(() => {
      effect.destroy();
    }, 2000);
    // console.log("Spawned eff at:", gridPos);
    return true;
  }

  private spawnStar(
    gridPos: { r: number; c: number },
    index: number = 0
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.starPrefab || !this.starNode) {
        console.error("Thiếu star prefab hoặc star node!");
        resolve();
        return;
      }

      const star = instantiate(this.starPrefab);
      star.layer = Layers.Enum.UI_2D;

      const totalWidth = this.cols * this.tileSize;
      const totalHeight = this.rows * this.tileSize;

      const startX = -totalWidth / 2 + this.tileSize / 2;
      const startY = totalHeight / 2 - this.tileSize / 2;
      const x = startX + (gridPos.c - 1) * this.tileSize;
      const y = startY - (gridPos.r - 1) * this.tileSize;

      star.setPosition(new Vec3(x, y, 10));
      const targetPos = new Vec3(300, 1000, 0);
      this.starNode.addChild(star);

      //increase score when star reaches target
      tween(star)
        .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
        .delay(0.3 + index * 0.02)
        .to(0.3, { position: targetPos })
        .delay(0.1)
        .call(() => {
          this.scoreManager?.addScore();
          resolve();
          star.destroy();
        })
        .start();

      // console.log("Spawned star at:", gridPos);
    });
  }

  private spawnStarNotDestroy(
    gridPos: { r: number; c: number },
    index: number = 0
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.starPrefab || !this.starNode) {
        console.error("Thiếu star prefab hoặc star node!");
        resolve();
        return;
      }

      const star = instantiate(this.starPrefab);
      star.layer = Layers.Enum.UI_2D;

      const totalWidth = this.cols * this.tileSize;
      const totalHeight = this.rows * this.tileSize;

      const startX = -totalWidth / 2 + this.tileSize / 2;
      const startY = totalHeight / 2 - this.tileSize / 2;
      const x = startX + (gridPos.c - 1) * this.tileSize;
      const y = startY - (gridPos.r - 1) * this.tileSize;

      star.setPosition(new Vec3(x, y, 10));
      this.hintNode.addChild(star);

      //increase score when star reaches target
      tween(star)
        .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
        .delay(0.1)
        .start();

      // console.log("Spawned star at:", gridPos);
    });
  }
  private spawnLine(
    from: { r: number; c: number },
    to: { r: number; c: number }
  ) {
    if (!this.linePrefab || !this.lineNode) return;

    const line = instantiate(this.linePrefab);
    line.layer = Layers.Enum.UI_2D;

    const totalWidth = this.cols * this.tileSize;
    const totalHeight = this.rows * this.tileSize;

    const startX = -totalWidth / 2 + this.tileSize / 2;
    const startY = totalHeight / 2 - this.tileSize / 2;

    const x1 = startX + (from.c - 1) * this.tileSize;
    const y1 = startY - (from.r - 1) * this.tileSize;
    const x2 = startX + (to.c - 1) * this.tileSize;
    const y2 = startY - (to.r - 1) * this.tileSize;

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

    const opacity =
      line.getComponent(UIOpacity) || line.addComponent(UIOpacity);
    opacity.opacity = 255;
    tween(opacity)
      .to(0.5, { opacity: 0 })
      .call(() => line.destroy())
      .start();
  }

  private spawnLineNotDestroy(
    from: { r: number; c: number },
    to: { r: number; c: number }
  ) {
    if (!this.linePrefab || !this.lineNode) return;

    const line = instantiate(this.linePrefab);
    line.layer = Layers.Enum.UI_2D;

    const totalWidth = this.cols * this.tileSize;
    const totalHeight = this.rows * this.tileSize;

    const startX = -totalWidth / 2 + this.tileSize / 2;
    const startY = totalHeight / 2 - this.tileSize / 2;

    const x1 = startX + (from.c - 1) * this.tileSize;
    const y1 = startY - (from.r - 1) * this.tileSize;
    const x2 = startX + (to.c - 1) * this.tileSize;
    const y2 = startY - (to.r - 1) * this.tileSize;

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
    this.hintNode.addChild(line);
  }

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  hint() {
    // duyệt tất cả tile
    for (let i1 = 0; i1 < this.rows; i1++) {
      for (let j1 = 0; j1 < this.cols; j1++) {
        const tile1 = this.tiles[i1][j1];
        if (!tile1 || !tile1.getIconSprite()) continue;

        for (let i2 = i1; i2 < this.rows; i2++) {
          for (let j2 = i2 === i1 ? j1 + 1 : 0; j2 < this.cols; j2++) {
            const tile2 = this.tiles[i2][j2];
            if (!tile2 || !tile2.getIconSprite()) continue;

            // nếu cùng icon và nối được
            if (tile1.getIconSprite() === tile2.getIconSprite()) {
              const path = this.canConnect(tile1, tile2);
              if (path) {
                // spawn line theo path
                for (let i = 0; i < path.length - 1; i++) {
                  this.spawnLineNotDestroy(path[i], path[i + 1]);
                }

                path.forEach((pos, index) => {
                  this.spawnStarNotDestroy(pos, index);
                });

                // spawn effect tại 2 đầu
                tile1.hintHighlight();
                tile2.hintHighlight();

                console.log("Hint pair:", i1, j1, " <-> ", i2, j2);
                return; // dừng ngay khi tìm thấy 1 cặp
              }
            }
          }
        }
      }
    }
    console.log("No hint available");
  }

  clearHints() {
    // clear line hint
    if (this.hintNode) {
      this.hintNode.removeAllChildren();
    }

    if (this.hintNode) {
      this.hintNode.removeAllChildren();
    }

    // clear highlight trên tile
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const tile = this.tiles[i][j];
        if (tile) {
          tile.hintUnhighlight();
        }
      }
    }
  }
}
