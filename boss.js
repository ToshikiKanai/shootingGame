// - boss ------------------------------------
function Boss(){
    this.position = new Point();
    this.size = 0
    this.life = 0
    this.param = 0;
    this.alive = false;
}

Boss.prototype.set = function(p, size, life){
    this.position.x = p.x;
    this.position.y = p.y;
      
    this.size = size;
    this.life = life;

    this.param = 0;

    this.alive = true;
};

Boss.prototype.move =  function(){
    var i, j;

    this.param++;

    switch(true){
        case this.param < 100:
            this.position.y += 1.5;
            break;
        
        default:
            i = ((this.param - 100) % 360) * Math.PI /180;  //ラジアンを求める計算

            j = screenCanvas.width / 2;
            this.position.x = j + Math.sin(i) * j;
            break;
    }
}

// - boss bit ------------------------------------
function Bit(){
    this.position = new Point();
    this.parent = null;
    this.size = 0;
    this.life = 0;
    this.param = 0;
    this.alive = 0;
}

Bit.prototype.set = function(parent, size, life, param){
    this.parent = parent;
    this.size = size;
    this.life = life;
    this.param = param;
    
    this.alive = true;
};

Bit.prototype.move = function(){
    var i, x, y;

    this.param++;

    i = (this.param % 360) * Math.PI / 180;

    x = Math.cos(i) * (this.parent.size + this.size);
    y = Math.sin(i) * (this.parent.size + this.size);

    this.position.x = this.parent.position.x + x;
    this.position.y = this.parent.position.y + y;
};
