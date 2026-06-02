using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenPlan.API.Data;
using OpenPlan.API.DTOs.Auth;
using OpenPlan.API.Models;

namespace OpenPlan.API.Services;

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return null;

        var user = new User
        {
            Email = req.Email.ToLower(),
            DisplayName = req.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthResponse(GenerateToken(user), user.Id, user.Email, user.DisplayName);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == req.Email.ToLower());
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return null;

        return new AuthResponse(GenerateToken(user), user.Id, user.Email, user.DisplayName);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.DisplayName)
            ],
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
