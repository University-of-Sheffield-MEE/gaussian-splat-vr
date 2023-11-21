import * as SPLAT from "gsplat";

const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const renderer = new SPLAT.WebGLRenderer();

async function main() {
  if (!navigator.xr) {
    alert("WebXR not supported");
    return;
  }
  const immersiveOK = await navigator.xr.isSessionSupported("immersive-vr");
  if (!immersiveOK) {
    alert("immersive-vr not supported");
    return;
  }

  const session = await navigator.xr.requestSession("immersive-vr");

  await renderer.gl.makeXRCompatible();

  await session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, renderer.gl)
  });
  const viewerRefSpace = await session.requestReferenceSpace("local")

  const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat";

  await SPLAT.Loader.LoadAsync(url, scene, (progress) => console.log(progress));

  let side = 0;
  const onDrawFrame: XRFrameRequestCallback = (currentFrameTime, frame) => {
    const glLayer = session.renderState.baseLayer;
    if (!glLayer) {
      console.warn("no glLayer")
      return;
    }
    const viewerPose = frame.getViewerPose(viewerRefSpace);
    if (!viewerPose) {
      console.warn("no viewerPose");
      return;
    }
    renderer.gl.bindFramebuffer(renderer.gl.FRAMEBUFFER, glLayer.framebuffer);
    for (const view of viewerPose.views) {
      const viewport = glLayer.getViewport(view);
      if (!viewport) {
        console.warn("no viewport");
        continue;
      }
      if (side === 0 && viewport.x === 0) {
        // continue;
      } else if (side === 1 && viewport.x > 0) {
        // continue;
      }
      renderer.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      renderer.gl.enable(renderer.gl.SCISSOR_TEST);
      renderer.gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height);
      const orientation = new SPLAT.Quaternion(view.transform.orientation.x, view.transform.orientation.y, view.transform.orientation.z, view.transform.orientation.w)
      console.log(view.transform.position);
      camera.position = new SPLAT.Vector3(view.transform.position.x, view.transform.position.y, view.transform.position.z)
        .multiply(new SPLAT.Vector3(10, -10, -10))
        .add(new SPLAT.Vector3(0, 0, -5));
      // camera.position = new SPLAT.Vector3(0, 0, -5),
      camera.rotation = SPLAT.Quaternion.FromEuler(orientation.toEuler().multiply(new SPLAT.Vector3(1, -1, -1)));
      // camera.rotation = new SPLAT.Quaternion(),
      renderer.render(scene, camera);
      camera.fx = viewport.height * 4;
      camera.fy = viewport.height * 4;
      renderer.gl.disable(renderer.gl.SCISSOR_TEST);
    }
    side = 1 - side;
    session.requestAnimationFrame(onDrawFrame);
  };

  session.requestAnimationFrame(onDrawFrame);
}

document.getElementById("enter-vr")!.addEventListener("click", () => {
  main();
});
