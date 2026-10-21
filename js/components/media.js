(function (Aureon) {
  'use strict';

  const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.readAsDataURL(file);
    });

  const loadImage = (source) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Imagem inválida.'));
      image.src = source;
    });

  async function fromFile(file, { maxEdge = 960, quality = 0.76, square = false } = {}) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem válido.');

    const image = await loadImage(await readAsDataUrl(file));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (square) {
      const side = Math.min(image.width, image.height);
      canvas.width = canvas.height = Math.min(maxEdge, side);
      context.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    } else {
      const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL('image/jpeg', quality);
  }

  Aureon.media = Object.freeze({ fromFile });
})(window.Aureon);
