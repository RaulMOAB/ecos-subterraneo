import { onMounted, onUnmounted, ref } from "vue";

export function useMouseSpring(stiffness = 0.18) {
  const x = ref(0),
    y = ref(0);
  let tx = 0,
    ty = 0,
    raf = 0;

  const onMove = (e) => {
    tx = e.clientX;
    ty = e.clientY;
  };
  const loop = () => {
    x.value += (tx - x.value) * stiffness;
    y.value += (ty - y.value) * stiffness;
    raf = requestAnimationFrame(loop);
  };

  onMounted(() => {
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(loop);
  });
  onUnmounted(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
  });

  return { x, y };
}
