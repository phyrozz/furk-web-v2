export async function checkImage(imageUrl: string): Promise<boolean> {
  while (true) {
    const res = await fetch(imageUrl, { method: 'HEAD' });
    if (res.ok) return true;
    await new Promise(resolve => setTimeout(resolve, 100)); // retry in 0.1s
  }
}
