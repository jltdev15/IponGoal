import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
export interface Spec extends TurboModule {
  derive(
    passwordUtf8Hex: string,
    saltHex: string,
    iterations: number,
  ): Promise<string>;
}
export default TurboModuleRegistry.get<Spec>('NativePasswordCrypto');
