class RouletteGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.wheel = null;
        this.ball = null;
        this.isSpinning = false;
        this.betAmount = 1.00;
        this.selectedBets = [];
        
        this.numbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
            24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
        ];
        
        this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        
        this.init();
    }
    
    init() {
        this.createGameHTML();
        this.initCanvas();
        this.drawWheel();
        this.setupEventListeners();
    }
    
    createGameHTML() {
        document.body.innerHTML = `
            <div class="casino-game-container">
                <h1>🎯 Roulette Wheel</h1>
                <p>Your Balance: <span class="casino-balance">Loading...</span></p>
                
                <div class="game-area">
                    <canvas id="rouletteCanvas" width="400" height="400"></canvas>
                    
                    <div class="betting-area">
                        <h3>Place Your Bets</h3>
                        
                        <div class="bet-controls">
                            <label>Bet Amount:</label>
                            <input type="number" id="betAmount" value="1.00" min="0.01" step="0.01">
                        </div>
                        
                        <div class="bet-types">
                            <div class="bet-section">
                                <h4>Number Bets (35:1)</h4>
                                <div class="number-grid">
                                    ${this.generateNumberButtons()}
                                </div>
                            </div>
                            
                            <div class="bet-section">
                                <h4>Outside Bets</h4>
                                <button class="bet-button" data-bet="red">Red (1:1)</button>
                                <button class="bet-button" data-bet="black">Black (1:1)</button>
                                <button class="bet-button" data-bet="even">Even (1:1)</button>
                                <button class="bet-button" data-bet="odd">Odd (1:1)</button>
                                <button class="bet-button" data-bet="low">1-18 (1:1)</button>
                                <button class="bet-button" data-bet="high">19-36 (1:1)</button>
                            </div>
                        </div>
                        
                        <div class="selected-bets">
                            <h4>Your Bets</h4>
                            <div id="betsList"></div>
                            <div>Total: <span id="totalBet">0.00</span></div>
                        </div>
                        
                        <button class="casino-bet-button" onclick="rouletteGame.spin()" id="spinButton">
                            🎯 SPIN WHEEL
                        </button>
                        
                        <button class="clear-button" onclick="rouletteGame.clearBets()">
                            Clear Bets
                        </button>
                    </div>
                </div>
                
                <div class="result-area" id="resultArea"></div>
            </div>
            
            <style>
                .casino-game-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #1f2937, #111827);
                    border-radius: 12px;
                    color: white;
                    font-family: Arial, sans-serif;
                }
                
                .game-area {
                    display: flex;
                    gap: 20px;
                    margin: 20px 0;
                }
                
                canvas {
                    border: 3px solid #ffd700;
                    border-radius: 50%;
                    background: #2d3748;
                }
                
                .betting-area {
                    flex: 1;
                    background: #374151;
                    padding: 20px;
                    border-radius: 8px;
                }
                
                .bet-controls {
                    margin-bottom: 20px;
                }
                
                .bet-controls input {
                    width: 100px;
                    padding: 5px;
                    margin-left: 10px;
                    border: none;
                    border-radius: 4px;
                }
                
                .number-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 5px;
                    margin: 10px 0;
                }
                
                .number-btn {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #555;
                    background: #2d3748;
                    color: white;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .number-btn.red {
                    background: #dc2626;
                }
                
                .number-btn.selected {
                    border-color: #ffd700;
                    box-shadow: 0 0 5px #ffd700;
                }
                
                .bet-button {
                    display: block;
                    width: 100%;
                    margin: 5px 0;
                    padding: 8px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .bet-button:hover {
                    background: #2563eb;
                }
                
                .casino-bet-button {
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0 10px 0;
                }
                
                .clear-button {
                    width: 100%;
                    padding: 10px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .result-area {
                    background: #374151;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                    min-height: 50px;
                }
                
                @media (max-width: 768px) {
                    .game-area {
                        flex-direction: column;
                    }
                }
            </style>
        `;
    }
    
    generateNumberButtons() {
        let html = '<button class="number-btn green" data-number="0">0</button>';
        
        for (let i = 1; i <= 36; i++) {
            const isRed = this.redNumbers.includes(i);
            html += `<button class="number-btn ${isRed ? 'red' : 'black'}" data-number="${i}">${i}</button>`;
        }
        
        return html;
    }
    
    initCanvas() {
        this.canvas = document.getElementById('rouletteCanvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    drawWheel() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 180;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw wheel sections
        const angleStep = (Math.PI * 2) / this.numbers.length;
        
        this.numbers.forEach((number, index) => {
            const startAngle = index * angleStep;
            const endAngle = (index + 1) * angleStep;
            
            // Determine color
            let color = '#2d7d32'; // Green for 0
            if (number !== 0) {
                color = this.redNumbers.includes(number) ? '#dc2626' : '#1f1f1f';
            }
            
            // Draw section
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw number
            const textAngle = startAngle + angleStep / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.8);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.8);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), textX, textY);
        });
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw ball
        this.drawBall();
    }
    
    drawBall() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (!this.ball) {
            this.ball = { angle: 0, radius: 160 };
        }
        
        const ballX = centerX + Math.cos(this.ball.angle) * this.ball.radius;
        const ballY = centerY + Math.sin(this.ball.angle) * this.ball.radius;
        
        ctx.beginPath();
        ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.target.dataset.number);
                this.addBet('number', number, 35);
                e.target.classList.toggle('selected');
            });
        });
        
        // Outside bet buttons
        document.querySelectorAll('.bet-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const betType = e.target.dataset.bet;
                this.addBet(betType, betType, 1);
            });
        });
        
        // Bet amount input
        document.getElementById('betAmount').addEventListener('change', (e) => {
            this.betAmount = parseFloat(e.target.value) || 1.00;
        });
    }
    
    addBet(type, value, payout) {
        const amount = this.betAmount;
        const bet = { type, value, amount, payout };
        
        // Check if bet already exists
        const existingIndex = this.selectedBets.findIndex(b => 
            b.type === type && b.value === value
        );
        
        if (existingIndex >= 0) {
            this.selectedBets[existingIndex].amount += amount;
        } else {
            this.selectedBets.push(bet);
        }
        
        this.updateBetsDisplay();
    }
    
    updateBetsDisplay() {
        const betsList = document.getElementById('betsList');
        const totalBet = document.getElementById('totalBet');
        
        let html = '';
        let total = 0;
        
        this.selectedBets.forEach((bet, index) => {
            html += `<div>
                ${bet.type === 'number' ? 'Number ' + bet.value : bet.value.toUpperCase()}: 
                ${bet.amount.toFixed(2)} (${bet.payout}:1)
                <button onclick="rouletteGame.removeBet(${index})">❌</button>
            </div>`;
            total += bet.amount;
        });
        
        betsList.innerHTML = html;
        totalBet.textContent = total.toFixed(2);
    }
    
    removeBet(index) {
        this.selectedBets.splice(index, 1);
        this.updateBetsDisplay();
        
        // Remove visual selection for number bets
        document.querySelectorAll('.number-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    clearBets() {
        this.selectedBets = [];
        this.updateBetsDisplay();
        document.querySelectorAll('.number-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    async spin() {
        if (this.isSpinning || this.selectedBets.length === 0) return;
        
        const totalBetAmount = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
        
        if (totalBetAmount > window.casinoAPI.userBalance) {
            alert('Insufficient balance for total bets');
            return;
        }
        
        this.isSpinning = true;
        document.getElementById('spinButton').disabled = true;
        document.getElementById('resultArea').innerHTML = '<p>🎯 Spinning...</p>';
        
        // Animate wheel and ball
        const winningNumber = this.numbers[Math.floor(Math.random() * this.numbers.length)];
        await this.animateSpin(winningNumber);
        
        // Calculate results
        const gameResult = this.calculateResult(winningNumber);
        
        // Send bet to casino API
        window.casinoAPI.placeBet(totalBetAmount, gameResult);
        
        this.displayResult(winningNumber, gameResult);
        
        this.isSpinning = false;
        document.getElementById('spinButton').disabled = false;
        this.clearBets();
    }
    
    async animateSpin(winningNumber) {
        return new Promise(resolve => {
            let spins = 0;
            const maxSpins = 50;
            const interval = setInterval(() => {
                this.ball.angle += 0.2;
                this.drawWheel();
                
                spins++;
                if (spins >= maxSpins) {
                    clearInterval(interval);
                    
                    // Position ball on winning number
                    const winningIndex = this.numbers.indexOf(winningNumber);
                    const angleStep = (Math.PI * 2) / this.numbers.length;
                    this.ball.angle = winningIndex * angleStep + angleStep / 2;
                    this.drawWheel();
                    
                    resolve();
                }
            }, 100);
        });
    }
    
    calculateResult(winningNumber) {
        let totalWin = 0;
        const wins = [];
        
        this.selectedBets.forEach(bet => {
            let isWin = false;
            
            switch (bet.type) {
                case 'number':
                    isWin = bet.value === winningNumber;
                    break;
                case 'red':
                    isWin = this.redNumbers.includes(winningNumber) && winningNumber !== 0;
                    break;
                case 'black':
                    isWin = !this.redNumbers.includes(winningNumber) && winningNumber !== 0;
                    break;
                case 'even':
                    isWin = winningNumber % 2 === 0 && winningNumber !== 0;
                    break;
                case 'odd':
                    isWin = winningNumber % 2 === 1;
                    break;
                case 'low':
                    isWin = winningNumber >= 1 && winningNumber <= 18;
                    break;
                case 'high':
                    isWin = winningNumber >= 19 && winningNumber <= 36;
                    break;
            }
            
            if (isWin) {
                const winAmount = bet.amount * (bet.payout + 1);
                totalWin += winAmount;
                wins.push({ type: bet.type, value: bet.value, amount: winAmount });
            }
        });
        
        const totalBet = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
        const netWin = totalWin - totalBet;
        
        return {
            isWin: totalWin > 0,
            winAmount: Math.max(0, netWin),
            multiplier: totalBet > 0 ? totalWin / totalBet : 0,
            gameData: {
                winningNumber,
                wins,
                totalBet,
                totalWin
            }
        };
    }
    
    displayResult(winningNumber, gameResult) {
        const isRed = this.redNumbers.includes(winningNumber);
        const color = winningNumber === 0 ? 'green' : (isRed ? 'red' : 'black');
        
        let html = `
            <h3>🎯 Winning Number: <span style="color: ${color}">${winningNumber}</span></h3>
        `;
        
        if (gameResult.isWin) {
            html += `
                <p style="color: #10b981; font-size: 18px; font-weight: bold;">
                    🎉 You Won ${gameResult.winAmount.toFixed(2)}!
                </p>
                <p>Winning Bets:</p>
                <ul>
                    ${gameResult.gameData.wins.map(win => 
                        `<li>${win.type} ${win.value}: +${win.amount.toFixed(2)}</li>`
                    ).join('')}
                </ul>
            `;
        } else {
            html += `
                <p style="color: #f87171; font-size: 18px;">
                    Better luck next time!
                </p>
            `;
        }
        
        document.getElementById('resultArea').innerHTML = html;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.rouletteGame = new RouletteGame();
});