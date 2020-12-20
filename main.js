// - gloval ------------------------------------------------------------------------
var screenCanvas, info;
var run = true;
// var fps = 1000/30; 単位はms
var mouse = new Point();
var ctx; //canvas2d
var fire = false;
var counter = 0;
var message;
var score = 0;

// - const ------------------------------------------------------------------------
var CHARA_COLOR = "rgba(0, 0, 255, 0.75)";
var CHARA_SHOT_COLOR = "rgba(0, 255, 0 ,0.75)";
var CHARA_SHOT_MAX_COUNT = 100;
var ENEMY_COLOR = "rgba(255, 0, 0, 0.75)";
var ENEMY_MAX_COUNT = 10;
var ENEMY_SHOT_COLOR = "rgba(255, 0, 255, 0.75)"
var ENEMY_SHOT_MAX_COUNT = 100;
var BOSS_COLOR = "rgba(128, 128, 128, 0.75)";
var BOSS_BIT_COLOR = "rgba(64, 64, 64, 0.75)";
var BOSS_BIT_COUNT = 5;
var BOSS_TIME = 1500;

// - main ------------------------------------------------------------------------
//window.onload()メソッドは、DOMツリー構造および関連リソースが読み込まれたタイミングで実行される
//window.addEventListener('DOMContentLoaded', function(){}の方がwindow.onloadよりも早く実行される
window.onload = function(){
    //-- 各オブジェクト、プロパティの設定。この部分の処理が行われるのは一度だけ------------------------------------------
    //gloval valiable
    var i, j;
    var p = new Point(); //Point()は座標を表すオブジェクト

    //index.htmlの"screem"idをもつcanvas要素への参照を取得
    screenCanvas = document.getElementById("screen"); 
    screenCanvas.width = 256*2;
    screenCanvas.height = 256*2;

    //2dcontext
    ctx = screenCanvas.getContext("2d");

    //-- 四分木分割関連の処理 ----------------------------------------------------------------------------------------------------
    //線形四分木空間の用意
    let qTree = new QuadTree(screenCanvas.width, screenCanvas.height, 3);

    //-- 衝突判定 ------------------------------------
    //hitTest(n1,n2)を使用する際には引数のn1、n2のみ指定すればよい
    function hitTest(n1,n2,currentCharaIndex = 0, currentEnemyIndex = 0, charaObjList = [], enemyObjList =[]){
        const currentCharaCell = qTree.objectData[n1][currentCharaIndex];
        const currentEnemyCell = qTree.objectData[n2][currentEnemyIndex];
        // 現在のセルの中と、衝突オブジェクトリストとで当たり判定を取る。
        hitTestInCell(n1,currentCharaCell, currentEnemyCell, charaObjList, enemyObjList);

        //下位セルをもつか調べる
        let hasChildren = false;
        for(let i = 0; i < 4; i++){
            const nextIndex = currentCharaIndex * 4 + 1 + i;
            //下位セルがあった場合
            let hasChildCell = (nextIndex < qTree.objectData[n1].length) && (qTree.objectData[n1][nextIndex] !== null);
            hasChildren = hasChildren || hasChildCell;
            if(hasChildCell){
                //衝突オブジェクトリストにpush
                charaObjList.push(...currentCharaCell);
                hitTest(n1, n2, nextIndex, currentEnemyIndex, charaObjList, enemyObjList);
            }
        }
        //追加したオブジェクトをpop
        if(hasChildren){
            const popNum = currentCharaCell.length;
            for(let i = 0; i < popNum; i++){
                charaObjList.pop();
            }
        }

        hasChildren = false;
        for(let i = 0; i < 4; i++){
            const nextIndex = currentEnemyIndex * 4 + 1 + i;
            //下位セルがあった場合
            let hasChildCell = (nextIndex < qTree.objectData[n2].length) && (qTree.objectData[n2][nextIndex] !== null);
            hasChildren = hasChildren || hasChildCell;
            if(hasChildCell){
                //衝突オブジェクトリストにpush
                enemyObjList.push(...currentEnemyCell);
                hitTest(n1, n2, currentCharaIndex, nextIndex, charaObjList, enemyObjList);
            }
        }
        //追加したオブジェクトをpop
        if(hasChildren){
            const popNum = currentEnemyCell.length;
            for(let i = 0; i < popNum; i++){
                enemyObjList.pop();
            }
        }
        
    }

    //セル中&衝突オブジェクトリストとの当たり判定をとる
    //引数cellはセル内にあるオブジェクトの配列、引数objListは衝突オブジェクトリスト
    function hitTestInCell(n1, charaCell = [], enemyCell = [], charaObjList = [], enemyObjList = []){
        //-- セルの中で総当たり -----------
        // if(charaCell == null){charaCell = ["a","b"];}
        // if(enemyCell == null){enemyCell = ["a","b"];}
        const charaLength = charaCell.length;
        const enemyLength = enemyCell.length;
        if(n1 == 1){
            for(let i = 0; i < charaLength; i++){
                const obj1 = charaCell[i];
                for(let j = 0; j < enemyLength; j++){
                    const obj2 = enemyCell[j];
                    if(obj1.alive && obj2.alive){
                        const p = obj2.position.distance(obj1.position)
                        if(p.length() <= obj2.size){
                            obj1.alive = false;
                            obj2.alive = false;
                            console.log("false");
                            // obj1.life--;
                            // if(obj1.life == 0){
                            //     obj1.alive = false;
                            // }
                        }
                    }
                    
                }
            }
        }else if(n1 == 0){
            for(let i = 0; i < charaLength; i++){
                const obj1 = charaCell[i];
                // const obj1 = charaCell[0];
                for(let j = 0; j < enemyLength; j++){
                    const obj2 = enemyCell[j];
                    // if(obj1.alive && obj2.alive){
                        const p = obj2.position.distance(obj1.position);
                        if(p.length() <= obj1.size){
                            obj1.alive = false;
                            obj2.alive = false;
                            run = false;
                            info.style.color = "#ff0000";
                            message = "GAME OVER !!";

                        }
                    // }
                }
            }
        }
        //-- セルの中で総当たりは以上 -----------
        //-- 衝突オブジェクトリストと総当たり -----
        charaObjLength = charaObjList.length;
        enemyObjLength = enemyObjList.length;
            //セル中のエネミー(ショット)と、キャラクターの衝突オブジェクトリストとの衝突判定
        for(let i = 0; i < charaObjLength; i++){
            const obj = charaObjList[i]
            for(let j = 0; j < enemyLength; j++){
                const cellObj = enemyCell[j]
                const p = cellObj.position.distance(obj.position)
                if(p.length() <= cellObj.size){
                    cellObj.life--;
                    if(cellObj.life == 0){
                        cellObj.alive = false;
                    }
                }
            }
        }
            //セル中のキャラクター(ショット)と、エネミーの衝突オブジェクトリストとの衝突判定
        for(let i = 0; i < enemyObjLength; i++){
            const obj = enemyObjList[i];
            for(let j = 0; j < charaLength; j++){
                let cellObj = charaCell[j] 
                const p = cellObj.position.distance(obj.position)
                if(p.length() <= obj.size){
                    obj.life--;
                    if(obj.life == 0){
                        obj.alive = false;
                    }
                }
            }
        }
        //-- 衝突オブジェクトリストと総当たりは以上 -----
    }

    
    //-- 四分木分割関連の処理は以上 -------------------------------------------------------------------------------------------------

    //target.addEventListener()で(マウスの位置の検出などの)イベントを登録することができる
    screenCanvas.addEventListener("mousemove", mouseMove, true);
    screenCanvas.addEventListener("mousedown", mouseDown, true);
    window.addEventListener("keydown", keyDown, true);

    //index.htmlのp要素への参照を取得
    //pタグの中身を書き換えてスコアやマウスの座標情報をユーザに表示させる
    info = document.getElementById("info"); 

    //キャラクターオブジェクトを生成
    //ユーザはこのオブジェクトを操作してゲームをプレイする
    //ここではオブジェクトを生成しているだけで画面には表示されない
    var chara = new Character();
    chara.init(10);//キャラクターオブジェクトのサイズを設定

    //キャラクターオブジェクトのショット(弾)オブジェクトを格納する配列を用意する
    var charaShot = new Array(CHARA_SHOT_MAX_COUNT);
    for(i = 0; i<CHARA_SHOT_MAX_COUNT; i++){
        //ショット(弾)オブジェクトをCHARA_SHOT_MAX_COUNTの値(個数)だけ生成
        //ここではオブジェクトを生成しているだけで画面には表示されない
        charaShot[i] = new CharacterShot();　
    }

   //エネミーオブジェクトを格納する配列を用意すいる
   var enemy = new Array(ENEMY_MAX_COUNT);
   for(i = 0; i<ENEMY_MAX_COUNT; i++){
       //エネミーオブジェクトをENEMY_MAX_COUNTの値(個数)だけ生成
       //ここではオブジェクトを生成しているだけで画面には表示されない
       enemy[i] = new Enemy(); 
   } 

   //エネミーオブジェクトのショット(弾)オブジェクトを格納する配列を用意する
   var enemyShot = new Array(ENEMY_SHOT_MAX_COUNT);
   for(i = 0; i<ENEMY_SHOT_MAX_COUNT; i++){
       //ショット(弾)オブジェクトをENEMY_SHOT_MAX_COUNTの値(個数)だけ生成
        //ここではオブジェクトを生成しているだけで画面には表示されない
       enemyShot[i] = new EnemyShot();
   }

   //大ボスオブジェクトを生成
   var boss = new Boss();
   //小ボスオブジェクトを生成
   var bit  = new Array(BOSS_BIT_COUNT);
   for(i  = 0; i<BOSS_BIT_COUNT; i++){
       bit[i] = new Bit();
   }

   //キャラクターの初期位置を設定。ここでは画面下部中央に表示されるようにしている
   mouse.x = screenCanvas.width / 2;
   mouse.y = screenCanvas.height -20;

   //-- 各オブジェクト、プロパティの設定は以上------------------------------------------------------------------------

    // - call roop ------------------------------------------------------------------------
    (function(){
        //この関数の処理が繰り返される
        //ゲーム開始時からの時間経過をcounter関数で記録。
        //30fpsの場合、「counter % 30」で時間[s]を求めることができる
        counter++;

        //ctxは2dcontextオブジェクト
        //canvas要素への描画はctxの(プロパティや)メソッドを介して行われる
        //canvas要素内をクリアする
        ctx.clearRect(0, 0, screenCanvas.width, screenCanvas.height);

        //-- キャラクターの描画処理開始 ----------------------------------------------------------
        ctx.beginPath();

        chara.position.x = mouse.x;
        chara.position.y = mouse.y;

        //円形のキャラクターを描画
        // ctx.arc(chara.position.x, chara.position.y, chara.size, 0, Math.PI * 2, false);

        //三角形のキャラクターを描画
            //頂点を指定
        ctx.moveTo(mouse.x, mouse.y - chara.size * Math.sqrt(3) / 2);
        ctx.lineTo(mouse.x + chara.size, mouse.y + chara.size * Math.sqrt(3) / 2);
        ctx.lineTo(mouse.x - chara.size, mouse.y + chara.size * Math.sqrt(3) / 2);
        ctx.closePath();
            //塗りつぶしカラーを指定
        ctx.fillStyle = CHARA_COLOR;
            //塗りつぶす
        ctx.fill();
        //-- キャラクターの描画処理は以上 ----------------------------------------------------------

        //キャラクターのショット生成
        //canvas内でマウスがクリックされるとfireがtrueとなる
        if(fire){
            //search all my shot
            for(i = 0; i<CHARA_SHOT_MAX_COUNT; i++){
                if(!charaShot[i].alive){
                    charaShot[i].set(chara.position, 3, 3);//位置、サイズ、スピードを設定
                    break;//一度のクリックに対して発射する玉は1つなので、一度上記の処理が実行された時点でfor文を抜ける必要がある
                }
            }
            fire = false;
        }

        //-- キャラクターのショット描画処理開始 ----------------------------------------------------------
        ctx.beginPath();
        for(i = 0; i<CHARA_SHOT_MAX_COUNT; i++){
            if(charaShot[i].alive){
                charaShot[i].move();//charaShot[i]のy座標をスピードとして指定された値だけ上に移動させる

                //円を描画
                ctx.arc(
                    charaShot[i].position.x,
                    charaShot[i].position.y,
                    charaShot[i].size,
                    0, Math.PI * 2, false
                );

                ctx.closePath();
            }
        }
        ctx.fillStyle = CHARA_SHOT_COLOR;
        ctx.fill();
        //-- キャラクターのショット描画処理は以上 ----------------------------------------------------------

        //-- シーンの分岐 ------------------------------------------------------------------------------
        switch(true){
            case counter < 150:
                message = "READY...";
                break;
            
            case counter < 200:
                message = "GO!!";
                break;

            default:
                message = "";

                //-- エネミーの位置などの設定 ------------------------------------------
                if(counter % 10 === 0 && counter < BOSS_TIME){
                    if(counter % 100 === 0){
                    for(i = 0; i<ENEMY_MAX_COUNT; i++){
                        if(!enemy[i].alive){
                            j = (counter % 200) / 100;

                            var enemySize = 15;
                            p.x = -enemySize + (screenCanvas.width + enemySize * 2) * j;
                            p.y = screenCanvas.height / 2;

                            enemy[i].set(p, enemySize, j);//.set()が呼び出されるとaliveプロパティはtrueとなる
                            break;
                            }
                        }
                    }
                }else if(counter === BOSS_TIME){
                    p.x = screenCanvas.width / 2;
                    p.y = -80;
                    boss.set(p, 50, 30)

                    for(i = 0; i<BOSS_BIT_COUNT; i++){
                        j = 360 / BOSS_BIT_COUNT;
                        bit[i].set(boss, 15, 5, i * j);
                    }
                }
                //-- エネミーの位置などの設定は以上 ------------------------------------------
        }
        //-- シーンの分岐は以上 ------------------------------------------------------------------------------

        //-- エネミーの描画処理開始 ---------------------------------------------------------------------------
        ctx.beginPath();
        for(i = 0; i<ENEMY_MAX_COUNT; i++){
            if(enemy[i].alive){
                enemy[i].move();
                ctx.arc(
                    enemy[i].position.x,
                    enemy[i].position.y,
                    enemy[i].size,
                    0, Math.PI * 2, false
                );

                if(enemy[i].param % 30 === 0){
                    for(j = 0; j<ENEMY_SHOT_MAX_COUNT; j++){
                        if(!enemyShot[j].alive){
                            p = enemy[i].position.distance(chara.position);
                            p.normalize();
                            enemyShot[j].set(enemy[i].position, p, 5, 2);

                            break;
                        }
                    }
                }

                ctx.closePath();
            }
        }
        ctx.fillStyle = ENEMY_COLOR;
        ctx.fill();
        //-- エネミーの描画処理開始は以上 -------------------------------------------------------------------------

        //-- エネミーのショット描画処理開始 ---------------------------------------------------------------------------
        ctx.beginPath();
        for(i = 0; i<ENEMY_SHOT_MAX_COUNT; i++){
            if(enemyShot[i].alive){
                enemyShot[i].move();

                ctx.arc(
                    enemyShot[i].position.x,
                    enemyShot[i].position.y,
                    enemyShot[i].size,
                    0, Math.PI * 2, false
                );

                ctx.closePath();
            }
        }
        ctx.fillStyle = ENEMY_SHOT_COLOR;
        ctx.fill();
        //-- エネミーのショット描画処理は以上 -------------------------------------------------------------------------

        //-- ボスの描画処理開始 -------------------------------------------------------------------------------------
            //-- 大ボスの描画処理開始 ----------------------------------------------------------
        ctx.beginPath();
        if(boss.alive){
            boss.move();
            
            ctx.arc(
                boss.position.x,
                boss.position.y,
                boss.size,
                0, Math.PI * 2, false
            );

            ctx.closePath();
        }
        ctx.fillStyle = BOSS_COLOR;
        ctx.fill();
            //-- 大ボスの描画処理は以上 ----------------------------------------------------------

            //-- 小ボスの描画処理開始 ----------------------------------------------------------
        ctx.beginPath();
        for(i = 0; i<BOSS_BIT_COUNT;i++){
            if(bit[i].alive){
                bit[i].move();

                ctx.arc(
                    bit[i].position.x,
                    bit[i].position.y,
                    bit[i].size,
                    0, Math.PI * 2, false
                );

                if(bit[i].param % 60 === 0){
                    //小ボスのショットは通常のエネミーと共通
                    for(j = 0; i<ENEMY_SHOT_MAX_COUNT; j++){
                        if(!enemyShot[j].alive){
                            p = bit[i].position.distance(chara.position);
                            p.normalize();
                            enemyShot[j].set(bit[i].position, p, 4, 1.5);

                            break;
                        }
                    }
                }

                ctx.closePath();
            }
        }
        fillStyle = BOSS_BIT_COLOR;
        ctx.fill();
            //-- 小ボスの描画処理は以上 ----------------------------------------------------------
        //-- ボスの描画処理は以上 ------------------------------------------------------------------------------------
        
        //-- 衝突判定 ----------------------------------------------------------------------------------------------
        //四分木を使った衝突判定

        //四分木をクリア
        qTree.clear();
        //qTree.addObj(n, obj)で各オブジェクトを四分木に登録
        /*　引数nは、追加するオブジェクトをあらわす。
            キャラクター : 0
            キャラクターショット : １
            エネミー : 2
            エネミーショット : 3
        */
        //キャラクターショットを登録
        for(i = 0; i < CHARA_SHOT_MAX_COUNT; i++){
            // if(charaShot[i].alive){
            //     qTree._addObj(1, charaShot[i]);
            // }
            qTree._addObj(1, charaShot[i]);
        }
        //エネミーを登録
        for(i = 0; i<ENEMY_MAX_COUNT; i++){
            // if(enemy[i].alive){
            //     qTree._addObj(2, enemy[i]);
            // }
            qTree._addObj(2, enemy[i]);
        }
        //hitTest(n1,n2)のn1はキャラクター(ショット)、n2はエネミー(ショット)
        hitTest(1,2);



        //ショットと敵orキャラクター間の距離をもとに衝突判定を行う
        //-- キャラクターショットの衝突判定 ----------------------------------------------------------------------------
        //存在する全てのキャラクターショット1つひとつに対して、生存している全ての敵との距離を計算し衝突判定を行っている→計算量O(n^2)
        for(i = 0; i<CHARA_SHOT_MAX_COUNT; i++){
            if(charaShot[i].alive){
                //-- エネミーとの衝突判定 ------------------------------------
                // for(j = 0; j<ENEMY_MAX_COUNT; j++){
                //     if(enemy[i].alive){
                //         p = enemy[j].position.distance(charaShot[i].position);
                //         if(p.length() <= enemy[j].size){
                //             enemy[j].alive = false;
                //             charaShot[i].alive = false;

                //             score++;
                            
                //             break;
                //         }
                //     }
                // }

                //-- 小ボスとの衝突判定 ------------------------------------
                for(j = 0; j<BOSS_BIT_COUNT; j++){
                    if(bit[j].alive){
                        p = bit[j].position.distance(charaShot[i].position);
                        if(p.length() < bit[j].size){
                            bit[j].life--;
                            
                            charaShot[i].alive = false;

                            if(bit[j].life < 0){
                                bit[j].alive = false;
                                score += 3;
                            }

                            break;
                        }
                    }
                }

                //-- 大ボスとの衝突判定 ------------------------------------
                if(boss.alive){
                    p = boss.position.distance(charaShot[i].position);
                    if(p.length()< boss.size){
                        boss.life--;

                        charaShot[i].alive = false;

                        if(boss.life < 0){
                            score += 10;
                            run = false;
                            message = "CLEAR!!!!!";
                        }
                    }
                }
            }
        }
        //-- キャラクターショットの衝突判定は以上 --------------------------------------------------------------------

        //-- エネミーショットの衝突判定 ----------------------------------------------------------------------------

        //四分木を使った衝突判定
        qTree._addObj(0,chara);
        for(i = 0; i < ENEMY_SHOT_MAX_COUNT; i++){
            qTree._addObj(3,enemyShot[i]);
        }
        hitTest(0,3);

        //エネミーと小ボスともにショットオブジェクトは共通(enemyShot[i])なので、enemyShot[i]とキャラクターオブジェクトとの衝突判定のみ行えばOK
        // for(i = 0; i<ENEMY_SHOT_MAX_COUNT; i++){
        //     if(enemyShot[i].alive){
        //        p = chara.position.distance(enemyShot[i].position);
        //        if(p.length() < chara.size){
        //            charaShot.alive = false;

        //            run = false;
        //            info.style.color = "#ff0000";
        //            message = "GAME OVER !!";
        //            break;
        //        }
        //     }
        // }
        //-- エネミーショットの衝突判定は以上 ----------------------------------------------------------------------------

       

        info.innerHTML = "SCORE: " + (score * 100) + " " + message;
        //update HTML 
        //info.innerHTML = mouse.x + ":" + mouse.y;

        //runフラグを用いて再起呼び出し
        if(run){
            //calleeはargumentsオブジェクトのプロパティで、関数内部で実行中の関数を参照するために用いられる。
            //バグの原因になりやすいため非推奨
            requestAnimationFrame(arguments.callee);
            //setTimeout(arguments.callee, fps);
        }
    })();
}

//event
function mouseMove(event){
    //recursion mouse-point
    mouse.x = event.clientX - screenCanvas.offsetLeft;
    mouse.y = event.clientY - screenCanvas.offsetTop;
}

function keyDown(event){
    //get keycode
    var ck = event.keyCode;

    //escキーが押された場合
    if(ck === 27){
        run = false;
    }
    //スペースキーが押された場合
    // if(ck === 32 && counter % 2 == 0){
    //     fire = true;
    // }
    if(ck === 32){
        fire = true;
    }
}

function mouseDown(event){
    // up flag
    fire = true;
}