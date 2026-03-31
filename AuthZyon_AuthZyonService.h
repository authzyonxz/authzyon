#import <Foundation/Foundation.h>
#import "AuthZyonModels.h"

NS_ASSUME_NONNULL_BEGIN

@interface AuthZyonService : NSObject

@property (class, readonly, strong) AuthZyonService *shared;
@property (nonatomic, copy, nullable) NSString *currentKey;

- (void)validateKey:(NSString *)key completion:(void (^)(KeyValidationResponse * _Nullable response, NSError * _Nullable error))completion;
- (void)checkSavedKeyWithCompletion:(void (^)(KeyValidationResponse * _Nullable response))completion;
- (void)clearSavedKey;
- (NSString *)formatExpiryDate:(NSString *)isoString;
- (NSString *)getRemainingTime:(NSString *)expiresAt;

@end

NS_ASSUME_NONNULL_END
