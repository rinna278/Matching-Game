import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Layers, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tile')
export class Tile extends Component {
    @property(SpriteFrame)
    bgSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    iconSprite: SpriteFrame | null = null;

    private bgNode: Node | null = null;
    private iconNode: Node | null = null;
    private row: number = 0;
    private col: number = 0;
    private tileSize: number = 150;
    private isSelected: boolean = false;

    init(row: number, col: number, bgSprite: SpriteFrame, iconSprite: SpriteFrame, tileSize: number = 150) {
        this.row = row;
        this.col = col;
        this.bgSprite = bgSprite;
        this.iconSprite = iconSprite;
        this.tileSize = tileSize;
        
        this.createBackground();
        this.createIcon();
        this.setupTransform();
    }

    private createBackground() {
        this.bgNode = new Node(`TileBG_${this.row}_${this.col}`);
        this.bgNode.layer = Layers.Enum.UI_2D;
        this.bgNode.setPosition(0, 0, 0);
        
        const bgSprite = this.bgNode.addComponent(Sprite);
        if (this.bgSprite) {
            bgSprite.spriteFrame = this.bgSprite;
        }
        
        this.bgNode.addComponent(UITransform).setContentSize(this.tileSize, this.tileSize);
        this.node.addChild(this.bgNode);
    }

    private createIcon() {
        this.iconNode = new Node(`Icon_${this.row}_${this.col}`);
        this.iconNode.layer = Layers.Enum.UI_2D;
        this.iconNode.setPosition(0, 0, 1);
        
        const iconSprite = this.iconNode.addComponent(Sprite);
        if (this.iconSprite) {
            iconSprite.spriteFrame = this.iconSprite;
        }
        
        this.iconNode.addComponent(UITransform).setContentSize(this.tileSize * 0.8, this.tileSize * 0.8);
        this.node.addChild(this.iconNode);
    }

    private setupTransform() {
        this.node.addComponent(UITransform).setContentSize(this.tileSize, this.tileSize);
    }

    getIconSprite(): SpriteFrame | null {
        if (this.iconNode) {
            const sprite = this.iconNode.getComponent(Sprite);
            return sprite ? sprite.spriteFrame : null;
        }
        return null;
    }

    getGridPosition(): { row: number, col: number } {
        return { row: this.row, col: this.col };
    }

    select() {
        this.isSelected = true;
        this.node.setScale(1.2, 1.2, 1);
    }

    deselect() {
        this.isSelected = false;
        this.node.setScale(1, 1, 1);
    }

    getSelected(): boolean {
        return this.isSelected;
    }

    destroyWithAnimation(callback?: () => void) {
        tween(this.node)
            .to(0.2, { scale: new Vec3(0, 0, 1) })
            .call(() => {
                if (callback) callback();
                this.node.destroy();
            })
            .start();
    }

    // Để compatibility với code cũ
    getName(): string {
        return `Tile_${this.row}_${this.col}`;
    }
}