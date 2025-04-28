export type OptionalSome<T, U extends keyof T> = Omit<T, U> & Partial<Pick<T, U>>;
