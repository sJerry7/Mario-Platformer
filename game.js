// Game Configuration
let config = {
    type:Phaser.AUTO,
    
    scale:{
        mode:Phaser.Scale.FIT,
        width : 800,
        height :600,
    },
    
    backgroundColor : 0xffff11,

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};




//Global Game Variables
let user = prompt("Enter Player Name : ");
let level = 1;
let bombs;
let reward = 5;
let score = 0;
let gameOver = false;
let scoreText;
let apples;
let player;
let cursors;
let platforms;
let ground;
let rays;
let lives = 3;
let bg_music = new Audio('./Assets/Audio/music.mp3');
let bomb_sound = new Audio('./Assets/Audio/bomb.wav');
let fruit_sound = new Audio('./Assets/Audio/fruit.wav');
let clear_music = new Audio('./Assets/Audio/stage_clear.wav');
let over_music = new Audio('./Assets/Audio/game_over.wav');

// Functions to play music
function playMusic(music){
    music.play();
}

// Functions to pause music
function pauseMusic(music){
    music.pause();
}

// Play Background Music when Game Starts
playMusic(bg_music);





let game = new Phaser.Game(config);

let player_config = {
    player_speed : 150,
    player_jumpspeed : -700,
}



function preload ()
{
    this.load.image('sky', 'Assets/background.png');
    this.load.image('ground', 'Assets/topground.png');
    this.load.image('apple', 'Assets/apple.png');
    this.load.image('bomb', 'Assets/bomb.png');
    this.load.spritesheet('dude', 'Assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image("ray","Assets/ray.png");
}



function create ()
{
    W = game.config.width;
    H = game.config.height;

    //add ground using tilesprites
    ground = this.add.tileSprite(0,H-128,W,128,'ground');
    ground.setOrigin(0,0);

    //try to create a background
    background = this.add.sprite(0,0,'sky');
    background.setOrigin(0,0);
    background.displayWidth = W;
    background.displayHeight = H;
    background.depth = -2;

    //create rays on the top of the background
    rays = [];
    
    for(let i=-10;i<=10;i++){
        let ray = this.add.sprite(W/2,H-100,'ray');
        ray.displayHeight = 1.2*H;
        ray.setOrigin(0.5,1);
        ray.alpha = 0.2;
        ray.angle = i*20;
        ray.depth = -1;
        rays.push(ray);
    }

    //tween to rotate rays
    this.tweens.add({
        targets: rays,
        props:{
            angle:{
                value : "+=20"
            },
        },
        duration : 8000,
        repeat : -1
    });
    

    // The player and its settings
    player = this.physics.add.sprite(100, 100, 'dude', 4);

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.5);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key : 'left',
        frames: this.anims.generateFrameNumbers('dude',{start:0,end:3}),
        frameRate : 10,
        repeat : -1
    });

    this.anims.create({
        key : 'center',
        frames: [{key:'dude',frame:4}],
        frameRate : 10,
    });
    
    this.anims.create({
        key : 'right',
        frames: this.anims.generateFrameNumbers('dude',{start:5,end:8}),
        frameRate : 10,
        repeat : -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    
    //Add a group of apples = physical objects
    apples = this.physics.add.group({
        key: "apple",
        repeat : 8,
        setScale : {x:0.2,y:0.2},
        setXY : {x:10,y:0,stepX:80},
    });

    //add bouncing effect to all the apples
    apples.children.iterate(function(f){
        f.setBounce(Phaser.Math.FloatBetween(0.4,0.7));
    });

    // Initilaing Bombs varible as a Group which will hold multiple bombs 
    bombs = this.physics.add.group();

    let text = ' Welcome : '+user+'\t\t\t\t\t\t\t\t'+'Score : '+score+'\t\t\t\t\t\t\t\t'+'Level : '+level+'\t\t\t\t\t\t\t\t'+'Lives : '+lives;
 
    //  The score
    scoreText = this.add.text(9, 9, text, { fontSize: '18px', fill: '#000' });

    //create more platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(500,350,'ground').setScale(2,0.5).refreshBody();
    platforms.create(700,200,'ground').setScale(2,0.5).refreshBody();
    platforms.create(100,200,'ground').setScale(2,0.5).refreshBody();
    platforms.add(ground);
    
    // make ground as a static object so that physics does not apply to it
    this.physics.add.existing(ground,true); 
    
    //add a collision detection between player and ground
    this.physics.add.collider(platforms,player);    
    this.physics.add.collider(platforms,apples);
    this.physics.add.collider(bombs, platforms);

    // hide apple once player overlaps with it
    this.physics.add.overlap(player,apples,eatFruit,null,this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    
    //create cameras
    this.cameras.main.setBounds(0,0,W,H);
    this.physics.world.setBounds(0,0,W,H);
    
}



function update ()
{
    //Activity when left key is pressed
    if(cursors.left.isDown){
        player.setVelocityX(-player_config.player_speed);
        player.anims.play('left',true);
    }
    //Activity when right key is pressed
    else if(cursors.right.isDown){
        player.setVelocityX(player_config.player_speed);
        player.anims.play('right',true);
    }
    //Activity when no key is pressed
    else{
        player.setVelocityX(0);
        player.anims.play('center');
    }
    
    //Activity when down kye is pressed and player is on the platform or ground
    if(cursors.up.isDown && player.body.touching.down){
        player.setVelocityY(player_config.player_jumpspeed);
    }
}


// Activity to perform when the player overlaps with a fruit
function eatFruit (player, apple)
{
    playMusic(fruit_sound);
    apple.disableBody(true, true);

    //  Add and update the score
    score += reward;
    let text = ' Welcome : '+user+'\t\t\t\t\t\t\t\t'+'Score : '+score+'\t\t\t\t\t\t\t\t'+'Level : '+level+'\t\t\t\t\t\t\t\t'+'Lives : '+lives;
    scoreText.setText(text);

    if (apples.countActive(true) === 0)
    {
        pauseMusic(bg_music);
        playMusic(clear_music);
        
        player.body.moves = false;
        
        bombs.children.iterate(function(b){
            b.body.moves = false;
        });

        setTimeout(function(){

            playMusic(bg_music);    
            player.body.moves = true;

            //  A new batch of apples to collect
            apples.children.iterate(function (child) {

                child.enableBody(true, child.x, 0, true, true);

            });

            level+=1;
            reward +=5;


            bombs.children.iterate(function(b){
                b.body.moves = true;
            });

            if(level%2==0){
                let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

                let bomb = bombs.create(x, 16, 'bomb');
                bomb.setBounce(1);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
                bomb.allowGravity = false;
            }

        }, 5500);
    }
}




// Activity to perform when the player collides with a bomb
function hitBomb (player, bomb)
{
    playMusic(bomb_sound);
    lives -=1;
    let text = ' Welcome : '+user+'\t\t\t\t\t\t\t\t'+'Score : '+score+'\t\t\t\t\t\t\t\t'+'Level : '+level+'\t\t\t\t\t\t\t\t'+'Lives : '+lives;
    scoreText.setText(text);

    if(lives==0){
        
        this.physics.pause();

        player.setTint(0xff0000);

        player.anims.play('turn');

        gameOver = true;

        if(gameOver == true){

            pauseMusic(bg_music);
            playMusic(over_music);
            
            setTimeout(function(){
                alert("Game Over !! Try Again")
                location.reload();
            }, 4000);

        }
    }
}
