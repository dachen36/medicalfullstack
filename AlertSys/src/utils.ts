//线性异步函数！！  调用处 doing(....)
// 这是一个通用的线性包装函数，让异步请求返回 [error, data] 数组
export const doing = <T>(promise: Promise<T>): Promise<[Error | null, T | null]> => 
  promise.then((data): [null, T] => [null, data]).catch((err): [Error, null] => [err, null]);