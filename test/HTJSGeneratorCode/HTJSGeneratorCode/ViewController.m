//
//  ViewController.m
//  HTJSGeneratorCode
//
//  Created by Wangliping on 15/12/14.
//  Copyright © 2015年 Netease. All rights reserved.
//

#import "ViewController.h"
#import "HTTestModel.h"
#import "HTTestRequest.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    
    HTTestModel *model = [[HTTestModel alloc] init];
    NSLog(@"%@", model);
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
