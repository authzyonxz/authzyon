#import "Esp/ImGuiDrawView.h"
#import <Metal/Metal.h>
#import <MetalKit/MetalKit.h>
#import <Foundation/Foundation.h>
#define ICON_FA_COG u8"\uf013"
#define ICON_FA_EXTRA u8"\uf067"
#define ICON_FA_EXCLAMATION_TRIANGLE "\xef\x81\xb1"
#include <iostream>
#include <UIKit/UIKit.h>
#include <vector>
#include "iconcpp.h"
#import "pthread.h"
#include <array>
#include <cmath>
#include <deque>
#include <fstream>
#include <algorithm>
#include <string>
#include <sstream>
#include <cstring>
#include <cstdlib>
#include <cstdio>
#include <cstdint>
#include <cerrno>
#include <cctype>
// Imgui library
#import "AuthZyon/AuthZyonService.h"
#import "JRMemory.framework/Headers/MemScan.h"
#import "Esp/CaptainHook.h"
#import "Esp/ImGuiDrawView.h"
#import "IMGUI/imgui.h"
#import "IMGUI/imgui_internal.h"
#import "IMGUI/imgui_impl_metal.h"
#import "IMGUI/zzz.h"
#include "oxorany/oxorany_include.h"
#import "Helper/Mem.h"
#include "font.h"
#import "Esp/Includes.h"
#import "Helper/Vector3.h"
#import "Helper/Vector2.h"
#import "Helper/Quaternion.h"
#import "Helper/Monostring.h"
#import <Foundation/Foundation.h>
#include "Helper/font.h"
#include "Helper/data.h"
#include "ban.cpp"
ImFont* verdana_smol;
ImFont* pixel_big = {};
ImFont* pixel_smol = {};
#include "Helper/Obfuscate.h"
#import "Helper/Hooks.h"
#import "IMGUI/zzz.h"
#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>
#include <unistd.h>
#include <string.h>
#include "hook/hook.h"
ImVec4 userColor = ImVec4(1.0f, 0.0f, 0.0f, 1.0f);
ImVec4 espv = ImVec4(0.0f, 1.0f, 0.0f, 1.0f);
ImVec4 espi = ImVec4(1.0f, 0.0f, 0.0f, 1.0f);
ImVec4 fovColor = ImVec4(1.0f, 0.0f, 0.0f, 1.0f);
ImVec4 nameColor = ImVec4(1.0f, 1.0f, 1.0f, 1.0f);
ImVec4 distanceColor = ImVec4(1.0f, 1.0f, 1.0f, 1.0f);
#define timer(sec) dispatch_after(dispatch_time(DISPATCH_TIME_NOW, sec * NSEC_PER_SEC), dispatch_get_main_queue(), ^
#define kWidth  [UIScreen mainScreen].bounds.size.width
#define kHeight [UIScreen mainScreen].bounds.size.height
#define kScale [UIScreen mainScreen].scale
#define UIColorFromHex(hexColor) [UIColor colorWithRed:((float)((hexColor & 0xFF0000) >> 16))/255.0 green:((float)((hexColor & 0xFF00) >> 8))/255.0 blue:((float)(hexColor & 0xFF))/255.0 alpha:1.0]
UIWindow *mainWindow;
UIButton *menuView;
// Ghost Mode Variables


@interface ImGuiDrawView () <MTKViewDelegate>
@property (nonatomic, strong) id <MTLDevice> device;
@property (nonatomic, strong) id <MTLCommandQueue> commandQueue;
@end

@implementation ImGuiDrawView
ImFont *_espFont;
ImFont* verdanab;
ImFont* icons;
ImFont* interb;
ImFont* Urbanist;

static bool MenDeal = true;
BOOL hasGhostBeenDrawn = NO;
static bool StreamerMode = true;
static bool aimKill = false;
static bool voarPlayer = false;
static bool teleport8m = false;
bool fakeLagEnabled = false;
bool FastReloadEnabled = true;
bool SpeeeX2Enabled = false;
bool NoRecoilEnabled = false;
bool WallGlowEnabled = false;
bool WallFlyEnabled = false;
bool WallHackEnabled = false;
bool ScopeEnabled = false;
bool BypassEnabled = true;
bool istelekill = false;
bool isfly = false;
bool antiban(void *instance) {
    return false;
}


- (void)toggleSpeedX2:(BOOL)enable {
    static dispatch_once_t onceToken;
    static vector<void*> results;
    
    JRMemoryEngine *engine = new JRMemoryEngine(mach_task_self());
    AddrRange range = {0x100000000, 0x200000000};
    
    if (enable) {
        dispatch_once(&onceToken, ^{
            uint64_t search = 4397530849764387586;
            engine->JRScanMemory(range, &search, JR_Search_Type_ULong);
            results = engine->getAllResults();
        });
        
        uint64_t modify = 4366458311853765201;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_ULong);
        }
    } else {
        uint64_t modify = 4397530849764387586; // Original value
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_ULong);
        }
        onceToken = 0;
        results.clear();
    }
    delete engine;
}

- (void)toggleNoRecoil:(BOOL)enable {
    static dispatch_once_t onceToken;
    static std::vector<void*> results; 

    JRMemoryEngine* engine = new JRMemoryEngine(mach_task_self());
    AddrRange range = { 0x100000000, 0x200000000 }; 

    if (enable) {
        dispatch_once(&onceToken, ^{
            uint64_t search = 1016018816; 
            engine->result->resultBuffer.clear();
            engine->result->count = 0;
            engine->JRScanMemory(range, &search, JR_Search_Type_ULong);
            results = engine->getAllResults();
        });

        uint64_t modify = 0; 
        for (size_t i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_ULong);
        }
    } else {
        uint64_t modify = 1016018816; 
        for (size_t i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_ULong);
        }
        onceToken = 0; 
        results.clear();
    }

    delete engine;
}

- (void)toggleWallGlow:(BOOL)enable {
    static dispatch_once_t onceToken;
    static vector<void*> results;
    
    JRMemoryEngine *engine = new JRMemoryEngine(mach_task_self());
    AddrRange range = {0x100000000, 0x160000000};
    
    if (enable) {
        dispatch_once(&onceToken, ^{
            float search = 1.22f;
            engine->JRScanMemory(range, &search, JR_Search_Type_Float);
            results = engine->getAllResults();
        });

        
        float modify = 965.0f;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
    } else {
        float modify = 1.22f;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
        onceToken = 0;
        results.clear();
    }
    delete engine;
}



- (void)toggleWallFly:(BOOL)enable {
    static dispatch_once_t onceToken;
    static vector<void*> results;
    
    JRMemoryEngine *engine = new JRMemoryEngine(mach_task_self());
    AddrRange range = {0x100000000, 0x160000000};
    
    if (enable) {
        dispatch_once(&onceToken, ^{
            float search = 1.5f;
            engine->JRScanMemory(range, &search, JR_Search_Type_Float);
            results = engine->getAllResults();
        });
        
        float modify = 900.0f;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
    } else {
        float modify = 1.5f;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
        onceToken = 0;
        results.clear();
    }
    delete engine;
}

- (void)toggleWallHack:(BOOL)enable {
    static dispatch_once_t onceToken;
    static vector<void*> results;
    
    JRMemoryEngine *engine = new JRMemoryEngine(mach_task_self());
    AddrRange range = {0x100000000, 0x160000000};
    
    if (enable) {
        dispatch_once(&onceToken, ^{
            float search = 2;
            engine->JRScanMemory(range, &search, JR_Search_Type_Float);
            float search1 = 0.10000000149;
            engine->JRNearBySearch(0x20, &search1, JR_Search_Type_Float);
            float search2 = 3;
            engine->JRScanMemory(range, &search2, JR_Search_Type_Float);
            float search3 = 4.2038954e-45;
            engine->JRScanMemory(range, &search3, JR_Search_Type_Float);
            float search4 = 4.2038954e-45;
            engine->JRNearBySearch(0x20, &search4, JR_Search_Type_Float);
            results = engine->getAllResults();
        });
        
        float modify = -99;
        float modify1 = -1;
        float modify2 = -999;
        float modify3 = 1.3998972e-42;
        float modify4 = 1.3998972e-42;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
    } else {
        // Note: Original values not provided in the original code
        // You would need to restore the original values here
        onceToken = 0;
        results.clear();
    }
    delete engine;
}

- (void)toggleScope:(BOOL)enable {
    static dispatch_once_t onceToken;
    static vector<void*> results;
    
    JRMemoryEngine *engine = new JRMemoryEngine(mach_task_self());
    AddrRange range = {0x100000000, 0x160000000};
    
    if (enable) {
        dispatch_once(&onceToken, ^{
            float search = 0.03f;
            engine->JRScanMemory(range, &search, JR_Search_Type_Float);
            results = engine->getAllResults();
        });
        
        float modify = 10.0f;
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
    } else {
        float modify = 0.03f; // Original value
        for(int i = 0; i < results.size(); i++) {
            engine->JRWriteMemory((unsigned long long)(results[i]), &modify, JR_Search_Type_Float);
        }
        onceToken = 0;
        results.clear();
    }
    delete engine;
}

- (instancetype)initWithNibName:(nullable NSString *)nibNameOrNil bundle:(nullable NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];

    _device = MTLCreateSystemDefaultDevice();
    _commandQueue = [_device newCommandQueue];

    if (!self.device) abort();

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
   ImGuiStyle& style = ImGui::GetStyle();

// Color settings
style.Colors[ImGuiCol_Text]         = ImVec4(1.00f, 1.00f, 1.00f, 1.00f);
style.Colors[ImGuiCol_TextDisabled] = ImVec4(0.60f, 0.60f, 0.60f, 1.00f);
ImVec4 red      = ImVec4(1.00f, 0.00f, 0.00f, 1.00f); // #ff0000
ImVec4 redHover = ImVec4(1.00f, 0.20f, 0.20f, 1.00f); // mais claro no hover
ImVec4 redActive = ImVec4(1.00f, 0.10f, 0.10f, 0.80f); // um pouco mais escuro e com alpha
style.Colors[ImGuiCol_WindowBg] = ImVec4(0.0f, 0.0f, 0.0f, 1.0f); // preto absoluto
style.Colors[ImGuiCol_ChildBg]  = ImVec4(0.0f, 0.0f, 0.0f, 1.0f); // preto absoluto
style.Colors[ImGuiCol_PopupBg]  = ImVec4(0.0f, 0.0f, 0.0f, 1.0f); // preto absoluto
style.Colors[ImGuiCol_Button]                 = ImVec4(red.x, red.y, red.z, 0.80f);
style.Colors[ImGuiCol_ButtonHovered]          = red;
style.Colors[ImGuiCol_ButtonActive]           = red;
style.Colors[ImGuiCol_FrameBg]        = ImVec4(0.12f, 0.12f, 0.12f, 0.54f); // cinza escuro
style.Colors[ImGuiCol_FrameBgHovered] = ImVec4(0.20f, 0.20f, 0.20f, 0.60f); // um pouco mais claro
style.Colors[ImGuiCol_FrameBgActive]  = ImVec4(0.25f, 0.25f, 0.25f, 0.67f); // ligeiramente mais claro que hover
style.Colors[ImGuiCol_TitleBg]                = red;
style.Colors[ImGuiCol_TitleBgActive]          = red;
style.Colors[ImGuiCol_TitleBgCollapsed]       = red;
style.Colors[ImGuiCol_Header]                 = red;
style.Colors[ImGuiCol_HeaderHovered]          = red;
style.Colors[ImGuiCol_HeaderActive]           = red;
style.Colors[ImGuiCol_Tab]                    = red;
style.Colors[ImGuiCol_TabHovered]             = red;
style.Colors[ImGuiCol_TabActive]              = red;
style.Colors[ImGuiCol_ScrollbarBg]            = red;
style.Colors[ImGuiCol_ScrollbarGrab]          = red;
style.Colors[ImGuiCol_ScrollbarGrabHovered]   = red;
style.Colors[ImGuiCol_ScrollbarGrabActive]    = red;
style.Colors[ImGuiCol_CheckMark] = red;
style.Colors[ImGuiCol_SliderGrab] = red;
style.Colors[ImGuiCol_SliderGrabActive] = redActive;
style.Colors[ImGuiCol_Separator]        = red;

style.WindowRounding = 10.0f;
style.ChildRounding = 10.0f;
style.FrameRounding = 6.0f;
style.GrabRounding = 12.0f;
style.PopupRounding = 10.0f;
style.ScrollbarRounding = 10.0f;
style.TabRounding = 5.0f;

// Border sizes
style.WindowBorderSize = 1.0f;
style.FrameBorderSize = 1.0f;
style.PopupBorderSize = 1.0f;

// Spacing
style.WindowPadding = ImVec2(10.0f, 8.0f);
style.FramePadding = ImVec2(12.0f, 4.0f);
style.ItemSpacing = ImVec2(6.0f, 2.0f);












    static const ImWchar icons_ranges[] = { 0xf000, 0xf3ff, 0 };
    ImFontConfig icons_config;
    ImFontConfig CustomFont;
    CustomFont.FontDataOwnedByAtlas = false;
    icons_config.MergeMode = true;
    icons_config.PixelSnapH = true;
    io.Fonts->AddFontFromMemoryTTF(const_cast<std::uint8_t*>(Custom), sizeof(Custom), 21.f, &CustomFont);
    io.Fonts->AddFontFromMemoryCompressedTTF(font_awesome_data, font_awesome_size, 19.0f, &icons_config, icons_ranges);
    io.Fonts->AddFontDefault();
    ImFont* font = io.Fonts->AddFontFromMemoryTTF(sansbold, sizeof(sansbold), 21.0f, NULL, io.Fonts->GetGlyphRangesDefault());
    verdana_smol = io.Fonts->AddFontFromMemoryTTF(verdana, sizeof verdana, 40, NULL, io.Fonts->GetGlyphRangesDefault());
    pixel_big = io.Fonts->AddFontFromMemoryTTF((void*)smallestpixel, sizeof smallestpixel, 400, NULL, io.Fonts->GetGlyphRangesDefault());
    pixel_smol = io.Fonts->AddFontFromMemoryTTF((void*)smallestpixel, sizeof smallestpixel, 10*2, NULL, io.Fonts->GetGlyphRangesDefault());
    ImGui_ImplMetal_Init(_device);

    return self;
}

+ (void)showChange:(BOOL)open {
    MenDeal = open;
}

+ (BOOL)isMenuShowing {
    return MenDeal;
}

- (MTKView *)mtkView {
    return (MTKView *)self.view;
}

- (void)loadView
{
    CGFloat w = [UIApplication sharedApplication].windows[0].rootViewController.view.frame.size.width;
    CGFloat h = [UIApplication sharedApplication].windows[0].rootViewController.view.frame.size.height;
    self.view = [[MTKView alloc] initWithFrame:CGRectMake(0, 0, w, h)];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.mtkView.device = self.device;
    self.mtkView.delegate = self;
    self.mtkView.clearColor = MTLClearColorMake(0, 0, 0, 0);
    self.mtkView.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0];
    self.mtkView.clipsToBounds = YES;
    self.mtkView.clipsToBounds = YES;
}
#pragma mark - Interaction

- (void)updateIOWithTouchEvent:(UIEvent *)event
{
    UITouch *anyTouch = event.allTouches.anyObject;
    CGPoint touchLocation = [anyTouch locationInView:self.view];
    ImGuiIO &io = ImGui::GetIO();
    io.MousePos = ImVec2(touchLocation.x, touchLocation.y);

    BOOL hasActiveTouch = NO;
    for (UITouch *touch in event.allTouches)
    {
        if (touch.phase != UITouchPhaseEnded && touch.phase != UITouchPhaseCancelled)
        {
            hasActiveTouch = YES;
            break;
        }
    }
    io.MouseDown[0] = hasActiveTouch;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [self updateIOWithTouchEvent:event];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [self updateIOWithTouchEvent:event];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [self updateIOWithTouchEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [self updateIOWithTouchEvent:event];
}




// ÃÂÃÂ£ÃÂÃÂ¶ÃÂÃÂ ÃÂÃÂÃÂÃÂ¨ÃÂÃÂ drawInMTKView

#pragma mark - MTKViewDelegate

- (void)drawInMTKView:(MTKView*)view
{
    ImGuiIO& io = ImGui::GetIO();
    io.DisplaySize.x = view.bounds.size.width;
    io.DisplaySize.y = view.bounds.size.height;

    CGFloat framebufferScale = view.window.screen.nativeScale ?: UIScreen.mainScreen.nativeScale;
    io.DisplayFramebufferScale = ImVec2(framebufferScale, framebufferScale);
    io.DeltaTime = 1 / float(view.preferredFramesPerSecond ?: 60);



    
    id<MTLCommandBuffer> commandBuffer = [self.commandQueue commandBuffer];
        
    hideRecordTextfield.secureTextEntry = StreamerMode;

    if (MenDeal == true) 
    {
        [self.view setUserInteractionEnabled:YES];
        [self.view.superview setUserInteractionEnabled:YES];
        [menuTouchView setUserInteractionEnabled:YES];
    } 
    else if (MenDeal == false) 
    {
        [self.view setUserInteractionEnabled:NO];
        [self.view.superview setUserInteractionEnabled:NO];
        [menuTouchView setUserInteractionEnabled:NO];
    }

    MTLRenderPassDescriptor* renderPassDescriptor = view.currentRenderPassDescriptor;
    if (renderPassDescriptor != nil) 
    {
        id<MTLRenderCommandEncoder> renderEncoder = [commandBuffer renderCommandEncoderWithDescriptor:renderPassDescriptor];
        [renderEncoder pushDebugGroup:@"ImGui Jane"];

        ImGui_ImplMetal_NewFrame(renderPassDescriptor);
        ImGui::NewFrame();
        ImGuiStyle& style = ImGui::GetStyle();
        ImFont* font = ImGui::GetFont();
        font->Scale = 16.f / font->FontSize;
        
        CGFloat x = (([UIApplication sharedApplication].windows[0].rootViewController.view.frame.size.width) - 340) / 2;
        CGFloat y = (([UIApplication sharedApplication].windows[0].rootViewController.view.frame.size.height) - 250) / 2;

ImGui::SetNextWindowPos(ImVec2(x, y), ImGuiCond_FirstUseEver);
        ImGui::SetNextWindowSize(ImVec2(342, 265), ImGuiCond_FirstUseEver);

        
        if (MenDeal == true)
        {
            ImGui::Begin("                          FFH4X iOS", &MenDeal);
            
         
            ImGui::PushStyleVar(ImGuiStyleVar_ItemSpacing, ImVec2(9, 4));
            ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2(9, 4));

            if (ImGui::BeginTabBar("Tab", ImGuiTabBarFlags_FittingPolicyScroll))
            {
                // Tab Visuals
                if (ImGui::BeginTabItem(ICON_FA_CROSSHAIRS " AIM")) 
                {

    
   

ImGui::Columns(2, "AimBotColumns", false);
                               
                    ImGui::Checkbox("Ativar Aimbot", &Vars.Aimbot);
                  ImGui::Checkbox("Ignorar Derrubados", &Vars.IgnoreKnocked);

  ImGui::NextColumn();
    

                    ImGui::Checkbox("Puxar em Paredes", &Vars.VisibleCheck);
                    
                    ImGui::Checkbox("Exibir FOV", &Vars.isAimFov);
ImGui::Columns(1);


                    ImGui::Separator();
                    ImGui::Spacing();   


ImGui::PushItemWidth(190);
                ImGui::SliderFloat("Regular Fov", &Vars.AimFov, 0.00f, 360.00f, "[ %.1f ]", ImGuiSliderFlags_None);
ImGui::Combo("Puxada", &Vars.AimHitbox, Vars.aimHitboxes, 3);
ImGui::Spacing();   
                    ImGui::Separator();
                    ImGui::Spacing();   
ImGui::Text("Tipo de Aimbot:");
ImGui::RadioButton("Ao Atirar", &Vars.AimWhen, 1);
ImGui::SameLine();
ImGui::RadioButton("Ao Olhar", &Vars.AimWhen, 0);
ImGui::Spacing();   


ImGui::PopItemWidth();

ImGui::PushItemWidth(210);

ImGui::PopItemWidth();
                    // Push/Pop cÃÂÃÂ¢n bÃÂ¡ÃÂºÃÂ±ng
                    ImGui::Separator();

                    ImGui::EndTabItem();
                } 
								
								
if (ImGui::BeginTabItem(ICON_FA_EYE " ESP")) 
{
    // Ativar ESP e Esconder Painel na primeira linha
    ImGui::Columns(2, "ESPColumns1", false);
    ImGui::Checkbox("Ativar ESP", &Vars.Enable); 
    ImGui::NextColumn();
    ImGui::Checkbox("Esconder Painel", &StreamerMode);
    ImGui::Columns(1); // fecha as colunas
    ImGui::Separator();
    ImGui::Spacing();

    // ESP linhas lado a lado usando colunas
    ImGui::Columns(2, "ESPColumns2", false);

    ImGui::Checkbox("ESP Linha", &Vars.lines);
    ImGui::Checkbox("ESP Caixa", &Vars.Box);
    ImGui::Checkbox("ESP Esqueleto", &Vars.skeleton);
    ImGui::Checkbox("ESP Nome", &Vars.Name);
    ImGui::Checkbox("ESP Vida", &Vars.Health);
    ImGui::Checkbox(u8"Contar Inimigos", &Vars.CountPlayers);
    ImGui::NextColumn();
    ImGui::Checkbox(u8"ESP Distância", &Vars.Distance);
    ImGui::Columns(1);

    ImGui::Spacing();
    ImGui::Separator();
    ImGui::EndTabItem();
}


            
                // Tab Misc
                if (ImGui::BeginTabItem(ICON_FA_COG " MISC"))
{ 


    ImGui::TextColored(ImVec4(1.0f, 1.0f, 0.0f, 1.0f), ICON_FA_EXCLAMATION_TRIANGLE); // Ícone de aviso amarelo
    ImGui::SameLine();
    ImGui::Text(u8"Funções Rage");

    ImGui::Checkbox("AimKill   ", &aimKill);
     ImGui::SameLine();
ImGui::Checkbox("Voar Player", &Vars.UpPlayerOne);
     ImGui::SameLine();
    ImGui::Checkbox("Teleport 8m", &teleport8m);
    ImGui::Checkbox("Speed    ", &SpeeeX2Enabled);
    ImGui::SameLine();
    ImGui::Checkbox("No Recoil", &NoRecoilEnabled);
ImGui::Spacing(); 
    ImGui::Separator();
 ImGui::Spacing();
    // Combo de cores
    ImGui::TextColored(ImVec4(0, 1, 0, 1), ICON_FA_BARS);
    ImGui::SameLine();
    ImGui::Text(u8"Personalização");
ImGui::PushItemWidth(40.0f);
ImGui::ColorEdit4(ENCRYPT("Cor do Painel            "), (float*)&userColor, ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_NoTooltip | ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar);
ImGui::SameLine(); 
ImGui::ColorEdit4(ENCRYPT("Cor do FOV"), (float*)&fovColor, ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_NoTooltip | ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar);
ImGui::ColorEdit4(ENCRYPT(u8"Cor da ESP Visível   "), (float*)&espv, ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_NoTooltip | ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar);
ImGui::SameLine(); 
ImGui::ColorEdit4(ENCRYPT(u8"Cor da ESP Invisível"), (float*)&espi, ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_NoTooltip | ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar);
ImGui::ColorEdit4(ENCRYPT("Cor do Nome             "), (float*)&nameColor, ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_NoTooltip | ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar);
ImGui::SameLine();
ImGui::ColorEdit4(ENCRYPT(u8"Cor da Distância"), (float*)&distanceColor, ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_NoTooltip | ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar);
ImGui::PopItemWidth();
    ImGuiStyle& style = ImGui::GetStyle();

    style.Colors[ImGuiCol_CheckMark] = userColor;
    style.Colors[ImGuiCol_SliderGrab] = userColor;
    style.Colors[ImGuiCol_SliderGrabActive] = userColor;

    style.Colors[ImGuiCol_TitleBg] = userColor;
    style.Colors[ImGuiCol_TitleBgActive] = userColor;
    style.Colors[ImGuiCol_TitleBgCollapsed] = userColor;
    style.Colors[ImGuiCol_Separator] = userColor;

    style.Colors[ImGuiCol_Button] = userColor;
    style.Colors[ImGuiCol_ButtonHovered] = userColor;
    style.Colors[ImGuiCol_ButtonActive] = userColor;

    style.Colors[ImGuiCol_Tab] = userColor;
    style.Colors[ImGuiCol_TabHovered] = userColor;
    style.Colors[ImGuiCol_TabActive] = userColor;
    style.Colors[ImGuiCol_TabUnfocusedActive] = userColor;

    style.Colors[ImGuiCol_Header] = userColor;
    style.Colors[ImGuiCol_HeaderHovered] = userColor;
    style.Colors[ImGuiCol_HeaderActive] = userColor;

    style.Colors[ImGuiCol_NavHighlight] = userColor;
    style.Colors[ImGuiCol_TextSelectedBg] = userColor;
    style.Colors[ImGuiCol_ScrollbarBg] = userColor;
    style.Colors[ImGuiCol_ScrollbarGrab] = userColor;
    style.Colors[ImGuiCol_ScrollbarGrabHovered] = userColor;
    style.Colors[ImGuiCol_ScrollbarGrabActive] = userColor;

ImGui::Spacing();
ImGui::Separator();

ImGui::EndTabItem();

}

if (ImGui::BeginTabItem(ICON_FA_ADDRESS_CARD " INFO")) {

    // Usando a nova API AuthZyon para exibir informações
    NSString *savedKey = [AuthZyonService shared].currentKey;
    
    NSString *deviceModel = [[UIDevice currentDevice] model];
    NSString *iosVersion  = [[UIDevice currentDevice] systemVersion];

    // Exibição no ImGui
    ImGui::Text("Dispositivo: %s", [deviceModel UTF8String]);
    ImGui::Text(u8"Versão do iOS: %s", [iosVersion UTF8String]);
    
    if (savedKey) {
        ImGui::Text("Key: %s", [savedKey UTF8String]);
    } else {
        ImGui::Text("Key: Nenhuma key ativa");
    }
    
    ImGui::Text("Desenvolvedor: FFH4X");
    ImGui::Separator();
    ImGui::Spacing();
    if (ImGui::Button("Discord")) {
        NSURL *url = [NSURL URLWithString:@""];
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    }

    ImGui::SameLine();

    if (ImGui::Button(ENCRYPT(" Salvar Config "))) {
    self.mtkView.hidden = YES;
    MenDeal = NO;
    timer(30) {
        self.mtkView.hidden = NO;
        MenDeal = YES;
    });
}
    ImGui::EndTabItem();  // ✅ sempre dentro do BeginTabItem
}

    ImGui::EndTabBar(); // ✅ Fechar apenas depois de todas as tabs
}
            // Khôi phục style vars
            ImGui::PopStyleVar(2);
            ImGui::End();
        }
        
        ImDrawList* draw_list = ImGui::GetBackgroundDrawList();
        get_players();
        aimbot();
        game_sdk->init();
        
if (Vars.isAimFov && Vars.AimFov > 0) {
    ImVec2 center = ImVec2(ImGui::GetIO().DisplaySize.x / 2, ImGui::GetIO().DisplaySize.y / 2);

    if (Vars.fovaimglow) {
        static float rainbowHue = 0.0f;
        rainbowHue += ImGui::GetIO().DeltaTime * 0.8f;
        if (rainbowHue > 1.0f) rainbowHue = 0.0f;

        drawcircleglow(
            draw_list,
            center,
            Vars.AimFov,
            ImColor(fovColor), // usa cor configurada
            100,
            2.0f,
            12
        );
    } else {
        draw_list->AddCircle(
            center,
            Vars.AimFov,
            ImColor(fovColor),
            100,
            2.0f
        );
    }
}

        ImGui::Render();
        ImDrawData* draw_data = ImGui::GetDrawData();
        ImGui_ImplMetal_RenderDrawData(draw_data, commandBuffer, renderEncoder);
        [renderEncoder popDebugGroup];
        [renderEncoder endEncoding];
        [commandBuffer presentDrawable:view.currentDrawable];
        [commandBuffer commit];
    } 
} 

- (void)mtkView:(MTKView*)view drawableSizeWillChange:(CGSize)size {}
void hooking() {
void* address[] = {
               (void*)getRealOffset(ENCRYPTOFFSET("0x10126E688"))
    };
    void* function[] = {
                (void*)antiban                                                     
    };
            hook(address, function, 1);
}
void *hack_thread(void *) {

    sleep(5);
    hooking();
    pthread_exit(nullptr);
    return nullptr;
}

void __attribute__((constructor)) initialize() {
    pthread_t hacks;
    pthread_create(&hacks, NULL, hack_thread, NULL); 
}
@end
