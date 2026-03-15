import type { CSSProperties } from "react";
import { clampProgress, getBloomStage, type CherryBlossomProps } from "../types";

function mix(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function mixColor(from: [number, number, number], to: [number, number, number], progress: number) {
  return `rgb(${Math.round(mix(from[0], to[0], progress))} ${Math.round(mix(from[1], to[1], progress))} ${Math.round(mix(from[2], to[2], progress))})`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function windowedProgress(progress: number, start: number, end: number) {
  if (progress <= start) {
    return 0;
  }
  if (progress >= end) {
    return 1;
  }
  return (progress - start) / (end - start);
}

function createCherryPetalPath(length: number, width: number, notchDepth: number) {
  // より自然な波打つ形状の花びら
  const lobeX = width * 0.46;
  const shoulderX = width * 1.02;
  const outerY = -length * 0.92;
  const notchY = -length * (0.68 - notchDepth * 0.8);
  
  // 曲線をより複雑に（波打つ）
  const curve1X = -width * 0.38;
  const curve1Y = -length * 0.15;
  const curve2X = -shoulderX * 0.92;
  const curve2Y = -length * 0.45;

  return `
    M 0 0
    C ${curve1X} ${curve1Y},
      ${curve2X} ${curve2Y},
      ${-lobeX * 0.98} ${outerY * 0.96}
    Q ${-width * 0.02} ${notchY}, ${lobeX * 0.98} ${outerY * 0.96}
    C ${curve2X * -1} ${curve2Y},
      ${curve1X * -1} ${curve1Y},
      0 0
    Z
  `;
}

function createLeafPath(length: number, width: number) {
  return `
    M 0 0
    C ${width * 0.55} ${-length * 0.18},
      ${width} ${-length * 0.62},
      0 ${-length}
    C ${-width} ${-length * 0.62},
      ${-width * 0.55} ${-length * 0.18},
      0 0
    Z
  `;
}

function Bud({
  x,
  y,
  scale,
  rotate,
  openness,
  tint,
  edge,
}: {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  openness: number;
  tint: string;
  edge: string;
}) {
  // 蕾から花びらへの段階的な遷移
  const budPhase = Math.min(1, openness * 1.5); // より早く開き始める
  const bloomingStart = Math.max(0, (openness - 0.36) / 0.64); // 蕾が十分に開いたら花びらが現れる
  
  // 段階1: 蕾がまず縦に伸びる
  const budStretch = mix(1.12, 0.78, easeOutCubic(budPhase));
  const budLift = mix(0, -22, easeOutQuad(budPhase));
  const sepalSpread = mix(1, 0.58, easeInCubic(budPhase));
  
  // 段階2: 蕾から開く（萼が外へ広がる）
  const sepalRotate = mix(0, 18, Math.max(0, budPhase - 0.4) / 0.6);
  const sepalOpacity = mix(1, 0.3, budPhase);
  
  // 段階3: 蕾の外側部分が花びらのように開く
  const petalOpenDegree = Math.max(0, budPhase - 0.3) / 0.7; // 蕾が0.3以上開いたら花びら展開開始
  const petalSpreadAngle = mix(0, 65, easeOutCubic(petalOpenDegree));
  const petalDistance = mix(0, 8, easeOutQuad(petalOpenDegree));
  const petalScale = mix(0.85, 1.1, easeOutCubic(petalOpenDegree));
  const budCoreOpacity = mix(1, 0.2, petalOpenDegree);
  
  // 段階4: 新しい花びりが現れ始める
  const bloomingOpacity = Math.min(1, bloomingStart * 2);

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {/* 茎 */}
      <path
        d={`M0 54C-3 42-3 28 0 12C3 28 3 42 0 54Z`}
        fill="none"
        stroke="#87a95a"
        strokeWidth="3"
        strokeLinecap="round"
        opacity={mix(1, 0.6, budPhase)}
      />
      
      {/* 蕾本体の内核部分（開く時に見える中央） */}
      <g transform={`translate(0 ${budLift}) scale(1 ${budStretch})`} opacity={budCoreOpacity}>
        <path
          d="M0 22C-13 18-18 6-16-6C-12-24-4-36 0-43C4-36 12-24 16-6C18 6 13 18 0 22Z"
          fill={tint}
          stroke={edge}
          strokeWidth="1.5"
        />
        <path
          d="M0 18C-8 11-9 0-7-13C-3-24-1-30 0-33C1-30 3-24 7-13C9 0 8 11 0 18Z"
          fill="rgba(255,255,255,0.32)"
          opacity="0.72"
        />
      </g>
      
      {/* 蕾の外側部分が花びらのように開く（5つのパーツ） */}
      {petalOpenDegree > 0 && (
        <>
          {/* 上 */}
          <g 
            transform={`translate(0 ${mix(-28, -28 - petalDistance, petalOpenDegree)}) rotate(${mix(0, petalSpreadAngle, petalOpenDegree)}) scale(${petalScale})`}
            opacity={mix(0, 1, petalOpenDegree)}
          >
            <path
              d="M-6 0C-8 -6 -10 -14 -8 -20C-4 -28 2 -32 2 -36C2 -32 8 -28 12 -20C14 -14 12 -6 10 0Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.3"
            />
            <path
              d="M-4 -2C-6 -8 -6 -14 -4 -20C0 -26 4 -28 4 -32C4 -28 8 -26 10 -20C12 -14 10 -8 8 -2Z"
              fill="rgba(255,255,255,0.25)"
              opacity="0.6"
            />
          </g>
          
          {/* 右上 */}
          <g 
            transform={`translate(${mix(0, petalDistance * 0.95, petalOpenDegree)} ${mix(-20, -18 - petalDistance * 0.6, petalOpenDegree)}) rotate(${mix(0, petalSpreadAngle + 72, petalOpenDegree)}) scale(${petalScale})`}
            opacity={mix(0, 1, petalOpenDegree)}
          >
            <path
              d="M-6 0C-8 -6 -10 -14 -8 -20C-4 -28 2 -32 2 -36C2 -32 8 -28 12 -20C14 -14 12 -6 10 0Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.3"
            />
            <path
              d="M-4 -2C-6 -8 -6 -14 -4 -20C0 -26 4 -28 4 -32C4 -28 8 -26 10 -20C12 -14 10 -8 8 -2Z"
              fill="rgba(255,255,255,0.25)"
              opacity="0.6"
            />
          </g>
          
          {/* 右下 */}
          <g 
            transform={`translate(${mix(0, petalDistance * 0.58, petalOpenDegree)} ${mix(8, 8 + petalDistance * 0.8, petalOpenDegree)}) rotate(${mix(0, petalSpreadAngle + 144, petalOpenDegree)}) scale(${petalScale})`}
            opacity={mix(0, 1, petalOpenDegree)}
          >
            <path
              d="M-6 0C-8 -6 -10 -14 -8 -20C-4 -28 2 -32 2 -36C2 -32 8 -28 12 -20C14 -14 12 -6 10 0Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.3"
            />
            <path
              d="M-4 -2C-6 -8 -6 -14 -4 -20C0 -26 4 -28 4 -32C4 -28 8 -26 10 -20C12 -14 10 -8 8 -2Z"
              fill="rgba(255,255,255,0.25)"
              opacity="0.6"
            />
          </g>
          
          {/* 左下 */}
          <g 
            transform={`translate(${mix(0, -petalDistance * 0.58, petalOpenDegree)} ${mix(8, 8 + petalDistance * 0.8, petalOpenDegree)}) rotate(${mix(0, petalSpreadAngle + 216, petalOpenDegree)}) scale(${petalScale})`}
            opacity={mix(0, 1, petalOpenDegree)}
          >
            <path
              d="M-6 0C-8 -6 -10 -14 -8 -20C-4 -28 2 -32 2 -36C2 -32 8 -28 12 -20C14 -14 12 -6 10 0Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.3"
            />
            <path
              d="M-4 -2C-6 -8 -6 -14 -4 -20C0 -26 4 -28 4 -32C4 -28 8 -26 10 -20C12 -14 10 -8 8 -2Z"
              fill="rgba(255,255,255,0.25)"
              opacity="0.6"
            />
          </g>
          
          {/* 左上 */}
          <g 
            transform={`translate(${mix(0, -petalDistance * 0.95, petalOpenDegree)} ${mix(-20, -18 - petalDistance * 0.6, petalOpenDegree)}) rotate(${mix(0, petalSpreadAngle + 288, petalOpenDegree)}) scale(${petalScale})`}
            opacity={mix(0, 1, petalOpenDegree)}
          >
            <path
              d="M-6 0C-8 -6 -10 -14 -8 -20C-4 -28 2 -32 2 -36C2 -32 8 -28 12 -20C14 -14 12 -6 10 0Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.3"
            />
            <path
              d="M-4 -2C-6 -8 -6 -14 -4 -20C0 -26 4 -28 4 -32C4 -28 8 -26 10 -20C12 -14 10 -8 8 -2Z"
              fill="rgba(255,255,255,0.25)"
              opacity="0.6"
            />
          </g>
        </>
      )}
      
      {/* 萼（蕾の下の部分） */}
      <g 
        transform={`translate(0 14) scale(${sepalSpread}) rotate(${sepalRotate})`}
        opacity={sepalOpacity}
      >
        <path d="M0 12C-9 12-14-2-12-10C-5-7-2-3 0 12Z" fill="#98bd63" />
        <path d="M0 12C9 12 14-2 12-10C5-7 2-3 0 12Z" fill="#86ac55" />
        <path d="M0 12C-3 3-3-5 0-12C3-5 3 3 0 12Z" fill="#73974a" />
      </g>
      
      {/* 開く最初の花びら（蕾から生まれる） */}
      {bloomingStart > 0 && (
        <g opacity={bloomingOpacity}>
          {/* 上側の花びら */}
          <g transform={`rotate(-90) translate(0 ${-mix(0, 12, bloomingStart)}) scale(${mix(0.3, 0.8, bloomingStart)})`}>
            <path
              d="M 0 0 C -8 -4 -12 -14 -10 -24 C -6 -32 0 -36 0 -40 C 0 -36 6 -32 10 -24 C 12 -14 8 -4 0 0 Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.2"
              opacity={bloomingOpacity}
            />
          </g>
          {/* 右上の花びら */}
          <g transform={`rotate(0) translate(0 ${-mix(0, 12, bloomingStart)}) scale(${mix(0.3, 0.8, bloomingStart)})`}>
            <path
              d="M 0 0 C -8 -4 -12 -14 -10 -24 C -6 -32 0 -36 0 -40 C 0 -36 6 -32 10 -24 C 12 -14 8 -4 0 0 Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.2"
              opacity={bloomingOpacity}
            />
          </g>
          {/* 右下の花びら */}
          <g transform={`rotate(72) translate(0 ${-mix(0, 12, bloomingStart)}) scale(${mix(0.3, 0.8, bloomingStart)})`}>
            <path
              d="M 0 0 C -8 -4 -12 -14 -10 -24 C -6 -32 0 -36 0 -40 C 0 -36 6 -32 10 -24 C 12 -14 8 -4 0 0 Z"
              fill={tint}
              stroke={edge}
              strokeWidth="1.2"
              opacity={bloomingOpacity}
            />
          </g>
        </g>
      )}
    </g>
  );
}

function Blossom({
  x,
  y,
  scale,
  bloom,
  petalFill,
  petalEdge,
  budTint,
}: {
  x: number;
  y: number;
  scale: number;
  bloom: number;
  petalFill: string;
  petalEdge: string;
  budTint: string;
}) {
  // より高度な段階的開花アニメーション
  const easedBloom = easeOutCubic(bloom);
  
  // 花びらの大きさ変化：段階的に大きくなる
  const petalLength = mix(28, 78, easeInOutCubic(easedBloom));
  const petalWidth = mix(14, 50, easeInOutCubic(easedBloom));
  const notchDepth = mix(0.01, 0.18, easeOutCubic(bloom));
  
  // 花びらの位置：中から外へ広がる
  const petalOffset = mix(2, 24, easeOutCubic(easedBloom));
  const openness = mix(0.08, 1.05, easeOutCubic(easedBloom));
  const petalTilt = mix(-38, -2, easeInOutCubic(bloom));
  
  // 中心部分の表現
  const centerOpacity = mix(0, 1, Math.max(0, bloom - 0.1) / 0.9);
  const petalPath = createCherryPetalPath(petalLength, petalWidth, notchDepth);
  
  // 5枚の主要な花びら（桜の標準）
  const petalAngles = [-90, -18, 54, 126, 198] as const;
  
  // グラデーション用のユニークID
  const gradientId = `petalGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="30%">
          <stop offset="0%" stopColor={petalFill} />
          <stop offset="100%" stopColor={budTint} />
        </radialGradient>
      </defs>
      {/* 主要な5枚の花びら */}
      {petalAngles.map((angle, index) => {
        // 各花びらが時間差で出現・開く
        const delayStart = index * 0.08;
        const delayedBloom = Math.max(0, bloom - delayStart);
        const petalLocalProgress = Math.min(1, delayedBloom * 1.2); // より早く開く
        
        const petalRotation = mix(0, index * 6, easeOutQuad(petalLocalProgress));
        const petalOpacity = Math.min(1, petalLocalProgress * 1.3);
        
        const transform = `rotate(${angle + petalRotation}) translate(0 ${-petalOffset}) rotate(${petalTilt}) scale(1 ${openness})`;
        
        return (
          <g key={angle} transform={transform} opacity={Math.min(1, 0.8 + petalOpacity * 0.2)}>
            {/* メイン花びら */}
            <path 
              d={petalPath} 
              fill={`url(#${gradientId})`}
              stroke={petalEdge} 
              strokeWidth="1.9" 
              opacity={petalOpacity}
            />
            {/* 上部ハイライト（透明感） */}
            <path 
              d={petalPath} 
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              opacity={mix(0, 0.6, easeOutCubic(petalLocalProgress))}
              strokeLinecap="round"
            />
            {/* グラデーション効果（より細かく） */}
            <path 
              d={petalPath} 
              fill="rgba(255,255,255,0.12)"
              opacity={mix(0, 0.5, easeOutCubic(petalLocalProgress))}
              style={{
                filter: `blur(${mix(2, 0.3, petalLocalProgress)}px)`
              }}
            />
          </g>
        );
      })}

      {/* 中心部分 */}
      <g opacity={centerOpacity}>
        {/* 複数層の中心（グラデーション効果） */}
        <circle r="23" fill="rgba(255, 240, 245, 0.9)" opacity={mix(0, 1, Math.max(0, bloom - 0.12) / 0.78)} />
        <circle r="18" fill="rgba(252, 228, 238, 0.85)" opacity={mix(0, 1, Math.max(0, bloom - 0.18) / 0.72)} />
        <circle r="13" fill="rgba(248, 210, 228, 0.7)" opacity={mix(0, 1, Math.max(0, bloom - 0.25) / 0.65)} />
        <circle r="8" fill="rgba(245, 190, 215, 0.5)" opacity={mix(0, 1, Math.max(0, bloom - 0.32) / 0.58)} />
        
        {/* 花蕊（おしべ）- より詳細で優雅に */}
        {Array.from({ length: 18 }, (_, index) => {
          const baseAngle = -60 + (index * 360) / 18;
          const angleVariation = (index % 3) * 8 - 8;
          const angle = baseAngle + angleVariation;
          
          // より多彩な距離配置
          const distanceVar = (index % 5) * 2;
          const staminaDistance = 8 + distanceVar + Math.sin((index / 18) * Math.PI) * 3;
          const x2 = Math.cos((angle * Math.PI) / 180) * staminaDistance;
          const y2 = Math.sin((angle * Math.PI) / 180) * staminaDistance;
          
          const staminaDelay = (index % 6) * 0.03;
          const staminaProgress = Math.max(0, bloom - 0.22 - staminaDelay);
          const staminaOpacity = Math.min(1, staminaProgress * 2.8);
          
          // ぼかしと透明度のグラデーション
          const staminaColor = index % 3 === 0 ? '#f4d562' : index % 3 === 1 ? '#fbe89a' : '#f0c948';
          
          return (
            <g key={index} opacity={staminaOpacity}>
              {/* 花蕊の細い糸 */}
              <line 
                x1="0" 
                y1="0" 
                x2={x2} 
                y2={y2} 
                stroke={staminaColor}
                strokeWidth={mix(0.6, 1.1, staminaProgress)}
                strokeLinecap="round" 
                opacity={mix(0.4, 1, staminaProgress)}
                style={{
                  filter: `drop-shadow(0 1px 2px rgba(0,0,0,${0.1 * staminaProgress}))`
                }}
              />
              {/* 花蕊の球（先端） */}
              <circle 
                cx={x2} 
                cy={y2} 
                r={mix(1.2, 2.5, easeOutQuad(staminaProgress))}
                fill={staminaColor}
                opacity={mix(0.5, 1, staminaProgress)}
                style={{
                  filter: `drop-shadow(0 1px 3px rgba(244, 213, 98, ${0.3 * staminaProgress}))`
                }}
              />
              {/* 花蕊のハイライト */}
              <circle 
                cx={x2 - 0.7} 
                cy={y2 - 0.7} 
                r={mix(0.3, 0.9, easeOutQuad(staminaProgress))}
                fill="rgba(255,255,255,0.7)"
                opacity={mix(0, 0.8, staminaProgress)}
              />
            </g>
          );
        })}
      </g>
    </g>
  );
}

export function CherryBlossom({ progress, size = 320 }: CherryBlossomProps) {
  const bloom = clampProgress(progress);
  const stage = getBloomStage(bloom);

  // 1輪の桜が蕾から咲くまでの統一されたアニメーション
  const mainBudStage = windowedProgress(bloom, 0, 1); // 蕾が全段階で開く
  
  const leafStage = windowedProgress(bloom, 0.32, 0.92);
  const floatingAlpha = windowedProgress(bloom, 0.8, 1);

  // より自然で統一的な色：白から淡いピンクへ、そして深いピンクへ
  const petalFill = mixColor([255, 250, 252], [243, 195, 218], bloom);
  const petalEdge = mixColor([243, 220, 232], [218, 145, 180], bloom);
  const budTint = mixColor([255, 250, 252], [250, 222, 237], bloom);

  const fallingPetals = [
    { left: 160, top: 120, driftX: 20, spin: 280, delay: 0.1 },
    { left: 180, top: 140, driftX: -16, spin: 250, delay: 0.3 },
  ];

  return (
    <div className="blossom-container" aria-label={`桜の開花状態 ${stage}`}>
      <svg
        className="blossom-svg"
        viewBox="0 0 320 320"
        width={size}
        height={size}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="branchStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#907050" />
            <stop offset="100%" stopColor="#735437" />
          </linearGradient>
          <linearGradient id="leafFill" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#cce995" />
            <stop offset="100%" stopColor="#9bc85e" />
          </linearGradient>
        </defs>

        <g transform="translate(22 170)">
          <path
            d="M0 0C34 -10 76 -12 118 -6C152 -2 188 8 230 0C246 -3 260 -10 276 -18"
            fill="none"
            stroke="url(#branchStroke)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M118 -6C126 -24 134 -42 142 -60"
            fill="none"
            stroke="#816145"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity="0.82"
          />
          <path
            d="M191 -2C206 -18 220 -35 230 -52"
            fill="none"
            stroke="#816145"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity="0.82"
          />

          <g opacity={mix(0.24, 1, leafStage)} transform={`translate(128 -40) rotate(${mix(-8, 8, leafStage)}) scale(${mix(0.7, 1, leafStage)})`}>
            <path d={createLeafPath(42, 18)} fill="url(#leafFill)" stroke="#9cbc61" strokeWidth="1.3" />
            <path d="M0 0L0 -40" stroke="#85aa56" strokeWidth="1.1" />
          </g>
          <g opacity={mix(0.24, 1, leafStage)} transform={`translate(214 -34) rotate(${mix(22, 10, leafStage)}) scale(${mix(0.72, 1, leafStage)})`}>
            <path d={createLeafPath(38, 16)} fill="url(#leafFill)" stroke="#9cbc61" strokeWidth="1.3" />
            <path d="M0 0L0 -36" stroke="#85aa56" strokeWidth="1.1" />
          </g>

          {/* 中央の1輪の桜 - 蕾から咲く */}
          {mainBudStage < 0.6 ? (
            <Bud
              x={140}
              y={-60}
              scale={mix(1.12, 0.85, easeOutCubic(mainBudStage * 1.5))}
              rotate={0}
              openness={mainBudStage}
              tint={budTint}
              edge={petalEdge}
            />
          ) : (
            <Blossom
              x={140}
              y={-60}
              scale={mix(0.5, 1.15, easeOutCubic((mainBudStage - 0.6) / 0.4))}
              bloom={mainBudStage}
              petalFill={petalFill}
              petalEdge={petalEdge}
              budTint={budTint}
            />
          )}

          <g opacity={mix(0.04, 1, floatingAlpha)}>
            <g transform={`translate(258 -82) rotate(20) scale(${mix(0.25, 0.85, easeOutQuad(floatingAlpha))})`}>
              <path d={createCherryPetalPath(40, 24, 0.12)} fill={petalFill} stroke={petalEdge} strokeWidth="1.7" />
              <path d={createCherryPetalPath(40, 24, 0.12)} fill="rgba(255,255,255,0.22)" opacity={mix(0, 0.4, floatingAlpha)} />
            </g>
            <g transform={`translate(74 42) rotate(-34) scale(${mix(0.23, 0.82, easeOutQuad(floatingAlpha))})`}>
              <path d={createCherryPetalPath(44, 22, 0.12)} fill={petalFill} stroke={petalEdge} strokeWidth="1.7" />
              <path d={createCherryPetalPath(44, 22, 0.12)} fill="rgba(255,255,255,0.22)" opacity={mix(0, 0.4, floatingAlpha)} />
            </g>
          </g>
        </g>
      </svg>

      {bloom >= 0.85 && (
        <div className="falling-petals" aria-hidden="true">
          {fallingPetals.map((petal, index) => (
            <div
              key={index}
              className="falling-petal"
              style={
                {
                  left: `${petal.left}px`,
                  top: `${petal.top}px`,
                  animationDelay: `${petal.delay}s`,
                  "--drift-x": `${petal.driftX}px`,
                  "--spin": `${petal.spin}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
