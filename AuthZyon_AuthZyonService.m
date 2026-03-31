#import "AuthZyonService.h"

static NSString * const kBaseURL = @"https://authzyonsensi.up.railway.app";
static NSString * const kStorageKey = @"authzyon_saved_key";
static NSString * const kPackageToken = @"pkg_7hybToVi3tLsLojCy2nxFzSZ819FPWJc";
static NSString * const kPrefsDomain = @"com.zbe.9l.jitmenu";

@implementation AuthZyonService

+ (instancetype)shared {
    static AuthZyonService *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

// Caminho do arquivo de backup (Global e fora do sandbox do app, se possível)
- (NSString *)getFilePath {
    // Para rootless, tentamos usar o caminho de preferências do usuário
    NSString *path = @"/var/mobile/Library/Preferences/com.zbe.9l.jitmenu.key.txt";
    
    // Se não puder escrever no caminho global, tenta o diretório Documents do processo atual
    if (![[NSFileManager defaultManager] isWritableFileAtPath:@"/var/mobile/Library/Preferences/"]) {
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths firstObject];
        path = [documentsDirectory stringByAppendingPathComponent:@"authzyon_key.txt"];
    }
    return path;
}

- (void)saveKeyToDisk:(NSString *)key {
    if (!key) return;
    
    // 1. Salva via NSUserDefaults forçado para o domínio do tweak
    NSUserDefaults *prefs = [[NSUserDefaults alloc] initWithSuiteName:kPrefsDomain];
    [prefs setObject:key forKey:kStorageKey];
    [prefs synchronize];
    
    // 1.1 Salva também no standardUserDefaults para compatibilidade com partes do código que não usam suite
    [[NSUserDefaults standardUserDefaults] setObject:key forKey:kStorageKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    // 2. Backup em arquivo físico
    NSError *error = nil;
    [key writeToFile:[self getFilePath] atomically:YES encoding:NSUTF8StringEncoding error:&error];
    
    if (error) {
        NSLog(@"[AuthZyon] Erro ao salvar em arquivo: %@", error.localizedDescription);
    } else {
        NSLog(@"[AuthZyon] Key salva com sucesso em: %@", [self getFilePath]);
    }
}

- (NSString *)loadKeyFromDisk {
    // 1. Tenta carregar do NSUserDefaults do domínio do tweak
    NSUserDefaults *prefs = [[NSUserDefaults alloc] initWithSuiteName:kPrefsDomain];
    NSString *savedKey = [prefs stringForKey:kStorageKey];
    
    if (savedKey && savedKey.length > 5) {
        NSLog(@"[AuthZyon] Key carregada do NSUserDefaults: %@", savedKey);
        return savedKey;
    }
    
    // 2. Tenta carregar do arquivo físico
    savedKey = [NSString stringWithContentsOfFile:[self getFilePath] encoding:NSUTF8StringEncoding error:nil];
    if (savedKey && savedKey.length > 5) {
        savedKey = [savedKey stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
        NSLog(@"[AuthZyon] Key carregada do arquivo físico: %@", savedKey);
        return savedKey;
    }
    
    NSLog(@"[AuthZyon] Nenhuma key encontrada no disco.");
    return nil;
}

#pragma mark - Validar Key (primeira vez)

- (void)validateKey:(NSString *)key completion:(void (^)(KeyValidationResponse * _Nullable response, NSError * _Nullable error))completion {
    NSString *urlString = [NSString stringWithFormat:@"%@/api/public/validate-key", kBaseURL];
    NSURL *url = [NSURL URLWithString:urlString];
    if (!url) {
        if (completion) {
            completion(nil, [NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorBadURL userInfo:nil]);
        }
        return;
    }
    
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    request.HTTPMethod = @"POST";
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    
    NSDictionary *bodyDict = @{
        @"key": [key uppercaseString],
        @"packageToken": kPackageToken
    };
    NSError *jsonError = nil;
    NSData *bodyData = [NSJSONSerialization dataWithJSONObject:bodyDict options:0 error:&jsonError];
    
    if (jsonError) {
        if (completion) {
            completion(nil, jsonError);
        }
        return;
    }
    request.HTTPBody = bodyData;
    
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if (error) {
            if (completion) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    completion(nil, error);
                });
            }
            return;
        }
        
        if (data) {
            NSError *decodeError = nil;
            NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:data options:0 error:&decodeError];
            if (decodeError) {
                if (completion) {
                    dispatch_async(dispatch_get_main_queue(), ^{
                        completion(nil, decodeError);
                    });
                }
                return;
            }
            
            KeyValidationResponse *validationResponse = [[KeyValidationResponse alloc] initWithDictionary:jsonDict];
            if (validationResponse.success && validationResponse.key) {
                self.currentKey = validationResponse.key;
                [self saveKeyToDisk:validationResponse.key];
            }
            
            if (completion) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    completion(validationResponse, nil);
                });
            }
        }
    }];
    [task resume];
}

#pragma mark - Verificar Key Salva (auto-login)

- (void)checkSavedKeyWithCompletion:(void (^)(KeyValidationResponse * _Nullable response))completion {
    NSString *savedKey = [self loadKeyFromDisk];
    if (!savedKey) {
        if (completion) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(nil);
            });
        }
        return;
    }
    
    // Mudança importante: Usar POST com packageToken para garantir validação completa no servidor
    NSString *urlString = [NSString stringWithFormat:@"%@/api/public/validate-key", kBaseURL];
    NSURL *url = [NSURL URLWithString:urlString];
    if (!url) {
        if (completion) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(nil);
            });
        }
        return;
    }
    
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    request.HTTPMethod = @"POST";
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    
    NSDictionary *bodyDict = @{
        @"key": [savedKey uppercaseString],
        @"packageToken": kPackageToken
    };
    NSData *bodyData = [NSJSONSerialization dataWithJSONObject:bodyDict options:0 error:nil];
    request.HTTPBody = bodyData;
    
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if (error || !data) {
            if (completion) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    completion(nil);
                });
            }
            return;
        }
        
        NSError *decodeError = nil;
        NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:data options:0 error:&decodeError];
        if (decodeError) {
            if (completion) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    completion(nil);
                });
            }
            return;
        }
        
        KeyValidationResponse *validationResponse = [[KeyValidationResponse alloc] initWithDictionary:jsonDict];
        if (validationResponse.success) {
            self.currentKey = savedKey;
        } else {
            // Se o servidor disse que é inválida, limpamos para não tentar de novo
            self.currentKey = nil;
            [self clearSavedKey];
        }
        
        if (completion) {
            dispatch_async(dispatch_get_main_queue(), ^{
                completion(validationResponse);
            });
        }
    }];
    [task resume];
}

#pragma mark - Limpar Key Salva

- (void)clearSavedKey {
    self.currentKey = nil;
    NSUserDefaults *prefs = [[NSUserDefaults alloc] initWithSuiteName:kPrefsDomain];
    [prefs removeObjectForKey:kStorageKey];
    [prefs synchronize];
    
    // Limpa também o standardUserDefaults para garantir consistência
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kStorageKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    [[NSFileManager defaultManager] removeItemAtPath:[self getFilePath] error:nil];
}

#pragma mark - Formatar Data de Expiração

- (NSString *)formatExpiryDate:(NSString *)isoString {
    NSISO8601DateFormatter *isoFormatter = [[NSISO8601DateFormatter alloc] init];
    isoFormatter.formatOptions = NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;
    
    NSDate *date = [isoFormatter dateFromString:isoString];
    if (!date) {
        return isoString;
    }
    
    NSDateFormatter *displayFormatter = [[NSDateFormatter alloc] init];
    displayFormatter.dateStyle = NSDateFormatterMediumStyle;
    displayFormatter.timeStyle = NSDateFormatterShortStyle;
    displayFormatter.locale = [[NSLocale alloc] initWithLocaleIdentifier:@"pt_BR"];
    
    return [displayFormatter stringFromDate:date];
}

#pragma mark - Tempo Restante Formatado

- (NSString *)getRemainingTime:(NSString *)expiresAt {
    NSISO8601DateFormatter *isoFormatter = [[NSISO8601DateFormatter alloc] init];
    isoFormatter.formatOptions = NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;
    
    NSDate *expireDate = [isoFormatter dateFromString:expiresAt];
    if (!expireDate) {
        return @"Tempo desconhecido";
    }
    
    NSTimeInterval diff = [expireDate timeIntervalSinceDate:[NSDate date]];
    
    if (diff <= 0) {
        return @"Expirada";
    }
    
    NSInteger days = (NSInteger)(diff / (24 * 60 * 60));
    NSInteger hours = (NSInteger)(fmod(diff, 24 * 60 * 60) / (60 * 60));
    
    if (days > 0) {
        return [NSString stringWithFormat:@"%ld dia%@ restante%@", (long)days, days > 1 ? @"s" : @"", days > 1 ? @"s" : @""];
    }
    
    return [NSString stringWithFormat:@"%ld hora%@ restante%@", (long)hours, hours > 1 ? @"s" : @"", hours > 1 ? @"s" : @""];
}

@end
