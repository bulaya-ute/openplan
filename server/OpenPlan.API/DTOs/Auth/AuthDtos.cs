using System.ComponentModel.DataAnnotations;

namespace OpenPlan.API.DTOs.Auth;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string DisplayName
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string AccessToken,
    Guid UserId,
    string Email,
    string DisplayName
);
