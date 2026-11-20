import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap } from 'svelte/reactivity';
import { LANE_COUNT } from './lane';
import { laneAtPoint } from './laneAtPoint';

// レーン 0〜4 に割り当てるキー（event.code）。キーボード配列・IME の状態によらず物理的な位置で判別する
const LANE_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];

/** Play画面での入力操作（キーまたはタップ、クリック） を扱うクラス */
export class LaneInput {
  // キーで押下中のレーン
  #keyPressed = $state<boolean[]>(Array(LANE_COUNT).fill(false));
  // ポインタ（pointerId）ごとの押下中のレーン
  #pointerLanes = new SvelteMap<number, number>();

  #onPress: (lane: number) => void;

  // レーンごとの押下状態（キーまたはポインタ）
  // 現状はボタンの表示の切り替えにのみ用いる
  readonly pressed: boolean[] = $derived.by(() => {
    const pressedPointerLanes = [...this.#pointerLanes.values()];
    return this.#keyPressed.map((value, lane) => value || pressedPointerLanes.includes(lane));
  });

  constructor(onPress: (lane: number) => void) {
    this.#onPress = onPress;
  }

  // svg に付ける。外れたとき（Scene の破棄時）にリスナーを解除する
  attach: Attachment<SVGSVGElement> = (svg) => {
    const offs = [
      // 押下範囲の上にノーツなどが重なるため、svg に対してポインタを受け、座標からレーンを求める
      // - アクセシビリティを考慮すると html のボタン要素などを利用することが望ましいが、
      //   今回はキー入力（a〜g）で同じ操作ができ、ポインタの操作は補助的な入力手段のため良いものとする
      // - svelte の on() は SVGSVGElement に対しての型のオーバーロードがないため、型変換している
      on(svg, 'pointerdown', (e) => this.#handlePointerdown(svg, e as PointerEvent)),
      on(window, 'pointerup', this.#handlePointerup),
      on(window, 'pointercancel', this.#handlePointerup),
      on(window, 'keydown', this.#handleKeydown),
      on(window, 'keyup', this.#handleKeyup),
      on(window, 'blur', this.#handleBlur),
    ];

    return () => {
      for (const off of offs) off();
    };
  };

  #handlePointerdown(svg: SVGSVGElement, event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());

    const lane = laneAtPoint(point.x, point.y);
    if (lane === undefined) return;

    // 押下中に別のレーンへ動かしても、押下を始めたレーンのままとする
    this.#pointerLanes.set(event.pointerId, lane);
    this.#onPress(lane);
  }
  #handlePointerup = (event: PointerEvent) => {
    this.#pointerLanes.delete(event.pointerId);
  };
  #handleKeydown = (event: KeyboardEvent) => {
    const lane = LANE_KEYS.indexOf(event.code);
    if (lane < 0 || event.repeat) return;

    this.#keyPressed[lane] = true;
    this.#onPress(lane);
  };
  #handleKeyup = (event: KeyboardEvent) => {
    const lane = LANE_KEYS.indexOf(event.code);
    if (lane < 0) return;

    this.#keyPressed[lane] = false;
  };
  #handleBlur = () => {
    // ウィンドウのフォーカスが外れた際に、すべてのキーを離した扱いにする
    this.#keyPressed.fill(false);
  };
}
