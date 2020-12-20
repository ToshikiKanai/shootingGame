// 線形四分木空間
// 空間階層のことをレベルとする
// 各小空間のことをセルとする。

//オブジェクトの位置(座標)から左上と右下のモートン番号を求める
//左上と右下のモートン番号から所属するレベルを求める
//モートン番号とレベルから所属するセルを求める
//レベルとセル番号からオブジェクトを四分木に追加する
//四分木をクリアする
//実際にプロトタイプで使用するメソッドはclear()とaddObj(obj)かな？
class QuadTree{
    //QuadTreeクラスのプロパティ
    constructor(width, height, level){
        this.width = width;
        this.height = height;
        this.level = level;
        this.data = [null];
        this.currentLevel = 0;

        while(this.currentlevel < level){
            this.expand();
        }
        
        this.objectData = [this.data,this.data,this.data,this.data];
    }

    clear(){
        this.objectData[0].fill(null);
        this.objectData[1].fill(null);
        this.objectData[2].fill(null);
        this.objectData[3].fill(null);
    }

    // 要素をdataに追加する。
    // 必要なのは、要素と、レベルと、レベル内での番号。
    /*　引数nは、追加するオブジェクトをあらわす。
            キャラクター : 0
            キャラクターショット : １
            エネミー : 2
            エネミーショット : 3
    */
   //addNode()はaddObjで呼び出される
    addNode(n, node, level, index){
        //indexはその階層(level)の中での番号
        const offset = ((4 ** level) -1) / 3;
        const linearIndex = offset + index; 

        if(level > this.level){
            level = this.level
        }

        //セルの初期値はnullであるため、nodeを挿入するセルの上の階層を空配列で初期化する(nullのままにしない)。
        //空配列で初期化することにより、かくセルに複数のオブジェクトを挿入可能となる
        //全てのnに対して初期化が必要
        let parentCellIndex = linearIndex;
        for(var i = 0; i < 4; i++){
            while(this.data[i][parentCellIndex] === null){
                this.data[i][parentCellIndex] = [];

                parentCellIndex = Math.floor((parentCellIndex - 1) / 4);
            }
        }

        const cell = this.data[n][linearIndex];
        cell.push(node);
    }

    // オブジェクトを線形四分木に追加する。
    // オブジェクトの座標からモートン番号を計算し、適切なセルに割り当てる。
    /*　引数nは、追加するオブジェクトをあらわす。
            キャラクター : 0
            キャラクターショット : １
            エネミー : 2
            エネミーショット : 3
    */
    addObj(n, obj){
        const objId = n;
        const collider = obj;
        const size = collider.size;
        const left = collider.x - size
        const right = collider.x + size
        const top = collider.y - size
        const bottom = collider.y + size

        // モートン番号の計算。
        const leftTopMorton = this.calc2DMortonNumber(left, top);
        const rightBottomMorton = this.calc2DMortonNumber(right,bottom);

        // 左上も右下も-1（画面外）であるならば、
        // レベル0として扱う。
        // なおこの処理には気をつける必要があり、
        // 画面外に大量のオブジェクトがあるとレベル0に
        // オブジェクトが大量配置され、当たり判定に大幅な処理時間がかかる。
        // 実用の際にはここをうまく書き換えて、あまり負担のかからない処理に置き換えるといい。
        if(leftTopMorton === -1 && rightBottomMorton === -1){
            this.addNode(obj, 0, 0);
            return;
        }

        // 左上と右下が同じ番号に所属していたら、それはひとつのセルに収まっているということなので、 
        // 特に計算もせずそのまま現在のレベルのセルに入れる。
        if(leftTopMorton === rightBottomMorton){
            this.addNode(obj, this.currentLevel, leftTopMorton);
            return;
        }

        // 左上と右下が異なる番号（＝境界をまたいでいる）の場合、所属するレベルを計算する。
        const level = this.calcLevel(leftTopMorton, rightBottomMorton)
        // そのレベルでの所属する番号を計算する。
        // モートン番号の代表値として大きい方を採用する。これは片方が-1の場合、-1でない方を採用したいため。
        const larger = Math.max(leftTopMorton, rightBottomMorton);
        const cellNumber = this.calcCell(larger, level);

        //線形四分木に追加する
        this.addNode(objId, obj, level, cellNumber);
    }

    //-- 以下関数定義 --------------------------------------------------------------------------------------

    // 線形四分木の長さを伸ばす。
    expand(){
        const nextLevel = this.currentLevel + 1;
        const length = (4  ** (nextLevel + 1)) / 3;

        while(this.data.length < length){
            this.data.push(null);
        }

        this.currentLevel++;
    }

    // 16bitの数値を1bit飛ばしの32bitにする。
    // "|"はビットの論理和を求める演算子c
    separateBit32(){
        n = (n|(n<<8))& 0x00ff00ff;
        n = (n|(n<<4))& 0x0f0f0f0f;
        n = (n|(n<<2))& 0x33333333;
        return (n|(n<<1))& 0x55555555;
    }

    calc2DMortonNumber(x,y){
        if(x < 0|| y < 0){
            return -1;
        }else if(x > this.width || y > this.height){
            return -1
        }
        //空間の中の位置を求める
        const xCell = Math.floor(x / (this.width / (2 ** this.currentLevel)));
        const yCell = Math.floor(y / (this.height / (2 ** this.currentLevel)));
        // x位置とy位置をそれぞれ1bit飛ばしの数にし、
        // それらをあわせてひとつの数にする。
        // これがモートン番号となる。
        return (this.separateBit32(xCell)| (this.separateBit32(yCell)<<1));
    }

    // オブジェクトの所属レベルを算出する。
    //XORを取った数を2bitずつ右シフトして、0でない数が捨てられたときのシフト回数を採用する。
    calcLevel(leftTopMorton, rightBottomMorton){
        // "^"はXORを求める演算子
        const xorMorton = leftTopMorton ^ rightBottomMorton;
        let level = this.calcLevel  - 1;
        let attachedLevel = this.calcLevel;
        
        for(let i=0; level >=0; i++){
            const flag = (xorMorton >> (i * 2)) & 0x3;
            if(flag > 0){
                attachedLevel = level;
            }
            level--;
        }
        return attachedLevel;
    }

    // 階層を求めるときにシフトした数だけ右シフトすれば空間の位置がわかる。
    calcCell(morton, level){
        const shift = ((this.calcLevel - level) * 2);
        return morton >> shift;
    }   
}