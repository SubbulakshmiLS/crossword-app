import torch
import torch.nn as nn
import torch.nn.functional as F

class DepthwiseSeparableConv(nn.Module):
    """
    A depthwise separable convolution block that significantly reduces parameters 
    compared to standard convolutions.
    """
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        # Depthwise convolution
        self.depthwise = nn.Conv2d(in_channels, in_channels, kernel_size=3, 
                                   padding=1, stride=stride, groups=in_channels, bias=False)
        # Pointwise convolution
        self.pointwise = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.act = nn.GELU()

    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        x = self.bn(x)
        x = self.act(x)
        return x

class DoubleDSConv(nn.Module):
    """
    Two consecutive depthwise separable convolutions.
    """
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = DepthwiseSeparableConv(in_channels, out_channels)
        self.conv2 = DepthwiseSeparableConv(out_channels, out_channels)

    def forward(self, x):
        return self.conv2(self.conv1(x))

class ChannelAttention(nn.Module):
    def __init__(self, in_channels, reduction_ratio=8):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        
        self.mlp = nn.Sequential(
            nn.Conv2d(in_channels, in_channels // reduction_ratio, 1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(in_channels // reduction_ratio, in_channels, 1, bias=False)
        )
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.mlp(self.avg_pool(x))
        max_out = self.mlp(self.max_pool(x))
        return self.sigmoid(avg_out + max_out)

class SpatialAttention(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size=7, padding=3, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x_cat = torch.cat([avg_out, max_out], dim=1)
        return self.sigmoid(self.conv(x_cat))

class CBAM(nn.Module):
    """
    Convolutional Block Attention Module for Skip Connections
    """
    def __init__(self, channels, reduction_ratio=8):
        super().__init__()
        self.ca = ChannelAttention(channels, reduction_ratio)
        self.sa = SpatialAttention()

    def forward(self, x):
        x = x * self.ca(x)
        x = x * self.sa(x)
        return x

class LightUNetClassifier(nn.Module):
    """
    Lightweight U-Net inspired classifier for MRI Data.
    Uses Depthwise Separable Convolutions and CBAM attention in skip connections.
    """
    def __init__(self, in_channels=1, num_classes=1, base_filters=32):
        super().__init__()
        
        # Encoder
        self.enc1 = DoubleDSConv(in_channels, base_filters)
        self.pool1 = nn.MaxPool2d(2)
        
        self.enc2 = DoubleDSConv(base_filters, base_filters * 2)
        self.pool2 = nn.MaxPool2d(2)
        
        self.enc3 = DoubleDSConv(base_filters * 2, base_filters * 4)
        self.pool3 = nn.MaxPool2d(2)
        
        self.enc4 = DoubleDSConv(base_filters * 4, base_filters * 8)
        self.pool4 = nn.MaxPool2d(2)
        
        # Bottleneck
        self.bottleneck = DoubleDSConv(base_filters * 8, base_filters * 16)
        
        # CBAM Attention Modules for Skip Connections
        self.cbam4 = CBAM(base_filters * 8)
        self.cbam3 = CBAM(base_filters * 4)
        self.cbam2 = CBAM(base_filters * 2)
        self.cbam1 = CBAM(base_filters)

        # Decoder (Upsampling and Feature Fusion)
        self.up4 = nn.ConvTranspose2d(base_filters * 16, base_filters * 8, kernel_size=2, stride=2)
        self.dec4 = DoubleDSConv(base_filters * 16, base_filters * 8)
        
        self.up3 = nn.ConvTranspose2d(base_filters * 8, base_filters * 4, kernel_size=2, stride=2)
        self.dec3 = DoubleDSConv(base_filters * 8, base_filters * 4)
        
        self.up2 = nn.ConvTranspose2d(base_filters * 4, base_filters * 2, kernel_size=2, stride=2)
        self.dec2 = DoubleDSConv(base_filters * 4, base_filters * 2)
        
        self.up1 = nn.ConvTranspose2d(base_filters * 2, base_filters, kernel_size=2, stride=2)
        self.dec1 = DoubleDSConv(base_filters * 2, base_filters)

        # Classification Head
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(base_filters, base_filters // 2),
            nn.GELU(),
            nn.Linear(base_filters // 2, num_classes)
        )

    def forward(self, x):
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool1(e1))
        e3 = self.enc3(self.pool2(e2))
        e4 = self.enc4(self.pool3(e3))
        
        # Bottleneck
        b = self.bottleneck(self.pool4(e4))
        
        # Decoder with CBAM-gated skip connections
        d4 = self.up4(b)
        e4_attn = self.cbam4(e4)
        d4 = torch.cat([e4_attn, d4], dim=1)
        d4 = self.dec4(d4)
        
        d3 = self.up3(d4)
        e3_attn = self.cbam3(e3)
        d3 = torch.cat([e3_attn, d3], dim=1)
        d3 = self.dec3(d3)
        
        d2 = self.up2(d3)
        e2_attn = self.cbam2(e2)
        d2 = torch.cat([e2_attn, d2], dim=1)
        d2 = self.dec2(d2)
        
        d1 = self.up1(d2)
        e1_attn = self.cbam1(e1)
        d1 = torch.cat([e1_attn, d1], dim=1)
        d1 = self.dec1(d1)
        
        # Global Average Pooling and Classification
        pooled = self.global_pool(d1)
        pooled = torch.flatten(pooled, 1)
        out = self.classifier(pooled)
        
        return out

if __name__ == "__main__":
    # Instantiate the model
    model = LightUNetClassifier(in_channels=1, num_classes=1, base_filters=32)
    
    # Calculate parameter count
    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print("=" * 50)
    print(f"Model: LightUNetClassifier")
    print(f"Total Trainable Parameters: {total_params:,} ({(total_params/1e6):.2f}M)")
    if total_params < 5000000:
        print("Status: SUCCESS - Model is under 5M parameters!")
    print("=" * 50)
    
    # Dummy forward pass
    print("\nRunning dummy forward pass...")
    batch_size = 2
    # Typical MRI slice size 256x256
    dummy_input = torch.randn(batch_size, 1, 256, 256)
    
    # Check for GPU
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = model.to(device)
    dummy_input = dummy_input.to(device)
    
    # Forward
    output = model(dummy_input)
    
    print("\nForward Pass Results:")
    print(f"Input Shape:  {dummy_input.shape}  [Batch, Channels, Height, Width]")
    print(f"Output Shape: {output.shape}           [Batch, Classes]")
    print("=" * 50)
